import { getDb, getWbsItemsByProject } from './db';
import { wbsItems } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/** 지연·보류는 롤업 시 진행중으로 취급 */
export function normalizeRollupStatus(
  s: string
): 'not_started' | 'in_progress' | 'completed' {
  if (s === 'completed') return 'completed';
  if (s === 'not_started') return 'not_started';
  return 'in_progress';
}

/** 하위가 모두 완료→완료, 모두 미시작→미시작, 그 외(일부 진행·혼합)→진행중 */
export function rollupStatusFromChildren(
  children: { status: string }[]
): 'not_started' | 'in_progress' | 'completed' {
  if (children.length === 0) return 'not_started';
  const norm = children.map(c => normalizeRollupStatus(c.status));
  if (norm.every(x => x === 'completed')) return 'completed';
  if (norm.every(x => x === 'not_started')) return 'not_started';
  return 'in_progress';
}

/** 자식 실행일 중 가장 늦은 날짜(없으면 null) */
export function maxActualStartFromChildren(
  children: { actualStart: unknown }[]
): Date | null {
  const dates = children.map(c => toDate(c.actualStart)).filter(Boolean) as Date[];
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map(d => d.getTime())));
}

// YYYY-MM-DD 문자열 또는 Date 객체를 Date로 변환
function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = String(val);
  // ISO 형식 (2026-01-02T00:00:00.000Z) 또는 YYYY-MM-DD
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Date.UTC(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// 진행률 롤업: 테스크 → 액티비티 → 소공종 → 중공종 → 대공종
// 동일 가중치 기준 (단순 평균)
export async function recalculateProgress(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const allItems = await getWbsItemsByProject(projectId);

  // level 순서: task → activity → minor → middle → major
  const levels = ['task', 'activity', 'minor', 'middle', 'major'] as const;

  for (const level of levels) {
    if (level === 'task') continue; // task는 직접 입력

    const levelItems = allItems.filter(i => i.level === level);
    for (const item of levelItems) {
      // 직접 자식 찾기
      const children = allItems.filter(i => i.parentId === item.id);
      if (children.length === 0) continue;

      const avgProgress = children.reduce((sum, c) => sum + (c.progress || 0), 0) / children.length;
      const roundedProgress = Math.round(avgProgress * 100) / 100;

      // 상태: 하위 진행상태 기준(한 곳이라도 진행중이면 진행중, 전부 완료면 완료, 전부 미시작이면 미시작)
      const status = rollupStatusFromChildren(children) as typeof item.status;

      // 실행일: 하위 중 가장 늦은 실행일
      const actualStartRollup = maxActualStartFromChildren(children);

      // 일정 롤업: 자식 중 가장 이른 시작일, 가장 늦은 종료일
      const childStarts = children.map(c => toDate(c.planStart)).filter(Boolean) as Date[];
      const childEnds = children.map(c => toDate(c.planEnd)).filter(Boolean) as Date[];

      const planStart = childStarts.length > 0
        ? new Date(Math.min(...childStarts.map(d => d.getTime())))
        : toDate(item.planStart);
      const planEnd = childEnds.length > 0
        ? new Date(Math.max(...childEnds.map(d => d.getTime())))
        : toDate(item.planEnd);

      const updateData: Record<string, unknown> = {
        progress: roundedProgress,
        status,
        actualStart: actualStartRollup,
      };

      if (planStart) updateData.planStart = planStart;
      if (planEnd) updateData.planEnd = planEnd;

      await db.update(wbsItems).set(updateData as any).where(eq(wbsItems.id, item.id));

      // 메모리 내 업데이트
      const idx = allItems.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        allItems[idx].progress = roundedProgress;
        allItems[idx].status = status;
        allItems[idx].actualStart = actualStartRollup;
        if (planStart) allItems[idx].planStart = planStart;
        if (planEnd) allItems[idx].planEnd = planEnd;
      }
    }
  }
}

// 후속작업 일정 자동 조정
// 테스크의 일정이 변경되면 후속작업의 일정을 동일 일수만큼 조정
export async function adjustSuccessorSchedules(
  projectId: number,
  changedItemId: number,
  daysDiff: number
): Promise<void> {
  if (daysDiff === 0) return;
  const db = await getDb();
  if (!db) return;

  const allItems = await getWbsItemsByProject(projectId);
  const changedItem = allItems.find(i => i.id === changedItemId);
  if (!changedItem || !changedItem.successorCode) return;

  // BFS로 후속작업 체인 처리
  const visited = new Set<number>();
  const queue: string[] = [changedItem.successorCode];

  while (queue.length > 0) {
    const code = queue.shift()!;
    if (!code || code === '-') continue;

    const item = allItems.find(i => i.wbsCode === code && i.projectId === projectId);
    if (!item || visited.has(item.id)) continue;
    visited.add(item.id);

    // 일정 조정
    const startDate = toDate(item.planStart);
    const endDate = toDate(item.planEnd);
    const newStart = startDate ? shiftDate(startDate, daysDiff) : null;
    const newEnd = endDate ? shiftDate(endDate, daysDiff) : null;

    const updateData: Record<string, unknown> = {};
    if (newStart) updateData.planStart = newStart;
    if (newEnd) updateData.planEnd = newEnd;

    if (Object.keys(updateData).length > 0) {
      await db.update(wbsItems).set(updateData as any).where(eq(wbsItems.id, item.id));
    }

    // 후속작업 체인 계속
    if (item.successorCode && item.successorCode !== '-') {
      queue.push(item.successorCode);
    }
  }
}

function shiftDate(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function dateDiffInDays(date1: string | Date, date2: string | Date): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
