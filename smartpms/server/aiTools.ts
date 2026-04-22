import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { wbsItems as wbsItemsTable, issues as issuesTable, users as usersTable } from "../drizzle/schema";
import { like, or, eq, and, inArray } from "drizzle-orm";
// Removed Tool import

// --- Bookstack DB Pool ---
let bookstackPool: mysql.Pool | null = null;
function getBookstackPool() {
  if (!bookstackPool) {
    bookstackPool = mysql.createPool({
      host: ENV.bookstackHost,
      user: ENV.bookstackUser,
      password: ENV.bookstackPassword,
      database: ENV.bookstackDbName,
      connectionLimit: 5,
    });
  }
  return bookstackPool;
}

// --- Tools Implementation ---

// --- BookStack 헤딩 → 앵커 slug 변환 (BookStack JS와 동일 로직) ---
function headingToSlug(text: string): string {
  return text
    .replace(/[^\w\s가-힣-]/g, "")  // 특수문자 제거 (한글/영문/숫자/공백/하이픈 유지)
    .trim()
    .replace(/\s+/g, "-")           // 공백 → 하이픈
    .toLowerCase();
}

function extractHeadings(html: string): Array<{ level: number; text: string; slug: string }> {
  const headings: Array<{ level: number; text: string; slug: string }> = [];
  const regex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "").trim(); // HTML 태그 제거
    if (text) {
      headings.push({ level: parseInt(match[1]), text, slug: headingToSlug(text) });
    }
  }
  return headings;
}

function findBestHeadingAnchor(headings: Array<{ text: string; slug: string }>, keyword: string): string {
  const kw = keyword.toLowerCase();
  // 키워드가 포함된 헤딩 중 가장 구체적인(긴) 것 선택
  const matches = headings.filter(h => h.text.toLowerCase().includes(kw));
  if (matches.length > 0) {
    matches.sort((a, b) => a.text.length - b.text.length); // 가장 짧은(구체적인) 매칭
    return matches[0].slug;
  }
  // 키워드의 각 단어로 부분 매칭
  const words = kw.split(/\s+/).filter(w => w.length > 1);
  for (const word of words) {
    const partial = headings.filter(h => h.text.toLowerCase().includes(word));
    if (partial.length > 0) return partial[0].slug;
  }
  return "";
}

export async function searchWiki(keyword: string): Promise<string> {
  try {
    const pool = getBookstackPool();
    const query = `
      SELECT e.id, e.name, d.text, d.html
      FROM entities e 
      JOIN entity_page_data d ON e.id = d.page_id 
      WHERE e.type = 'page' AND (e.name LIKE ? OR d.text LIKE ?)
      LIMIT 3
    `;
    const searchPattern = `%${keyword}%`;
    const [rows] = await pool.execute(query, [searchPattern, searchPattern]);
    
    const results = rows as any[];
    if (results.length === 0) return `위키에서 '${keyword}'에 대한 검색 결과가 없습니다.`;

    const baseUrl = ENV.bookstackUrl.replace(/\/$/, "");
    let response = `[위키 검색 결과: ${keyword}]\n`;
    results.forEach((row) => {
      const excerpt = row.text ? row.text.substring(0, 500) + (row.text.length > 500 ? "..." : "") : "";
      
      // HTML에서 헤딩 추출 후 키워드와 매칭되는 앵커 찾기
      let pageUrl = `${baseUrl}/pages/${row.id}`;
      if (row.html) {
        const headings = extractHeadings(row.html);
        const anchor = findBestHeadingAnchor(headings, keyword);
        if (anchor) pageUrl += `#${anchor}`;
        
        // 목차 정보도 제공 (AI가 더 정확한 링크를 만들 수 있도록)
        const tocItems = headings.filter(h => h.level <= 3).slice(0, 15);
        if (tocItems.length > 0) {
          response += `- 문서명: ${row.name}\n  링크: ${pageUrl}\n`;
          response += `  목차: ${tocItems.map(h => `${"  ".repeat(h.level - 1)}${h.text}`).join(" | ")}\n`;
          response += `  내용요약: ${excerpt}\n\n`;
          return;
        }
      }
      
      response += `- 문서명: ${row.name}\n  링크: ${pageUrl}\n내용요약: ${excerpt}\n\n`;
    });
    return response;
  } catch (error) {
    console.error("BookStack DB Error:", error);
    return `위키 조회 중 오류가 발생했습니다: ${(error as Error).message}`;
  }
}

// --- 사용자 이름 조회 헬퍼 ---
async function getUserNameMap(db: any, userIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (userIds.length === 0) return map;
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return map;
  const rows = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, uniqueIds));
  for (const r of rows) map.set(r.id, r.name ?? "미지정");
  return map;
}

const STATUS_KR: Record<string, string> = {
  not_started: "미시작", in_progress: "진행중", completed: "완료", delayed: "지연", on_hold: "보류",
  open: "미해결", resolved: "해결", closed: "종결",
};
const LEVEL_KR: Record<string, string> = {
  major: "대공종", middle: "중공종", minor: "소공종", activity: "액티비티", task: "테스크",
};
const fmtDate = (d: any) => d ? String(d).substring(0, 10) : "-";

export async function searchWbsItems(keyword: string): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "WBS DB 접근 불가";

    const searchPattern = `%${keyword}%`;
    const results = await db.select()
      .from(wbsItemsTable)
      .where(or(
        like(wbsItemsTable.name, searchPattern),
        like(wbsItemsTable.wbsCode, searchPattern),
        like(wbsItemsTable.category, searchPattern)
      ))
      .limit(10);

    if (results.length === 0) return `WBS 항목 중 '${keyword}' 검색 결과가 없습니다.`;

    const userIds = results.flatMap(i => [i.assigneeId, i.managerId].filter(Boolean) as number[]);
    const nameMap = await getUserNameMap(db, userIds);

    let response = `[WBS 항목 검색 결과: ${keyword}] (${results.length}건)\n`;
    results.forEach((item) => {
      const level = LEVEL_KR[item.level] || item.level;
      const status = STATUS_KR[item.status] || item.status;
      const assignee = item.assigneeId ? nameMap.get(item.assigneeId) ?? "미지정" : "-";
      const manager = item.managerId ? nameMap.get(item.managerId) ?? "미지정" : "-";
      response += `- [${item.wbsCode}] ${item.name}\n`;
      response += `  구분: ${level} | 상태: ${status} | 진행률: ${item.progress}%\n`;
      response += `  계획: ${fmtDate(item.planStart)} ~ ${fmtDate(item.planEnd)}`;
      if (item.actualStart) response += ` | 실적시작: ${fmtDate(item.actualStart)}`;
      response += `\n`;
      response += `  담당자: ${assignee} | 관리자: ${manager}\n\n`;
    });
    return response;
  } catch (error) {
    console.error("WBS DB Error:", error);
    return `WBS 조회 중 오류 발생: ${(error as Error).message}`;
  }
}

export async function checkProjectIssues(keyword: string): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "DB 접근 불가";

    const searchPattern = `%${keyword}%`;
    const results = await db.select()
      .from(issuesTable)
      .where(or(
        like(issuesTable.title, searchPattern),
        like(issuesTable.description, searchPattern)
      ))
      .limit(10);

    if (results.length === 0) return `'${keyword}' 관련 이슈 검색 결과가 없습니다.`;

    const userIds = results.flatMap(i => [i.reporterId, i.assigneeId].filter(Boolean) as number[]);
    const nameMap = await getUserNameMap(db, userIds);

    // WBS 항목명 조회
    const wbsIds = results.map(i => i.wbsItemId).filter(Boolean) as number[];
    const wbsMap = new Map<number, string>();
    if (wbsIds.length > 0) {
      const wbsRows = await db.select({ id: wbsItemsTable.id, name: wbsItemsTable.name, wbsCode: wbsItemsTable.wbsCode })
        .from(wbsItemsTable).where(inArray(wbsItemsTable.id, wbsIds));
      for (const w of wbsRows) wbsMap.set(w.id, `[${w.wbsCode}] ${w.name}`);
    }

    const TYPE_KR: Record<string, string> = { risk: "리스크", defect: "결함", request: "요청", question: "질문", other: "기타" };
    const PRIORITY_KR: Record<string, string> = { critical: "긴급", high: "높음", medium: "보통", low: "낮음" };

    let response = `[이슈 검색 결과: ${keyword}] (${results.length}건)\n`;
    results.forEach((issue) => {
      const status = STATUS_KR[issue.status] || issue.status;
      const type = TYPE_KR[issue.type] || issue.type;
      const priority = PRIORITY_KR[issue.priority] || issue.priority;
      const assignee = issue.assigneeId ? nameMap.get(issue.assigneeId) ?? "미지정" : "-";
      const reporter = nameMap.get(issue.reporterId) ?? "미지정";
      const wbsName = issue.wbsItemId ? wbsMap.get(issue.wbsItemId) ?? "-" : "-";
      response += `- ${issue.title}\n`;
      response += `  유형: ${type} | 우선순위: ${priority} | 상태: ${status}\n`;
      response += `  보고자: ${reporter} | 담당자: ${assignee}\n`;
      if (issue.wbsItemId) response += `  연결 WBS: ${wbsName}\n`;
      if (issue.dueDate) response += `  마감일: ${fmtDate(issue.dueDate)}\n`;
      if (issue.resolutionContent) response += `  처리내용: ${issue.resolutionContent.substring(0, 200)}\n`;
      response += `\n`;
    });
    return response;
  } catch (error) {
    console.error("Issue DB Error:", error);
    return `이슈 조회 중 오류 발생`;
  }
}

// --- 추가 도구: WBS 하위 항목 조회 ---
export async function getWbsChildren(wbsCode: string): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "DB 접근 불가";

    // 해당 WBS 코드의 항목 찾기
    const parent = await db.select().from(wbsItemsTable)
      .where(like(wbsItemsTable.wbsCode, `%${wbsCode}%`)).limit(1);
    if (parent.length === 0) return `WBS 코드 '${wbsCode}'에 해당하는 항목이 없습니다.`;

    const parentItem = parent[0];
    const children = await db.select().from(wbsItemsTable)
      .where(eq(wbsItemsTable.parentId, parentItem.id));

    if (children.length === 0) return `[${parentItem.wbsCode}] ${parentItem.name}의 하위 항목이 없습니다.`;

    const userIds = children.flatMap(i => [i.assigneeId, i.managerId].filter(Boolean) as number[]);
    const nameMap = await getUserNameMap(db, userIds);

    let response = `[${parentItem.wbsCode}] ${parentItem.name}의 하위 항목 (${children.length}건)\n`;
    children.forEach((item) => {
      const level = LEVEL_KR[item.level] || item.level;
      const status = STATUS_KR[item.status] || item.status;
      const assignee = item.assigneeId ? nameMap.get(item.assigneeId) ?? "-" : "-";
      response += `- [${item.wbsCode}] ${item.name} (${level})\n`;
      response += `  상태: ${status} | 진행률: ${item.progress}% | 담당: ${assignee}\n`;
      response += `  계획: ${fmtDate(item.planStart)} ~ ${fmtDate(item.planEnd)}\n\n`;
    });
    return response;
  } catch (error) {
    console.error("WBS Children Error:", error);
    return `하위 항목 조회 오류: ${(error as Error).message}`;
  }
}

// --- 추가 도구: 담당자별 업무 조회 ---
export async function getTasksByAssignee(assigneeName: string): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "DB 접근 불가";

    // 이름으로 사용자 찾기
    const matchedUsers = await db.select().from(usersTable)
      .where(like(usersTable.name, `%${assigneeName}%`)).limit(5);
    if (matchedUsers.length === 0) return `'${assigneeName}' 이름의 담당자를 찾을 수 없습니다.`;

    const userIds = matchedUsers.map(u => u.id);
    const nameMap = new Map(matchedUsers.map(u => [u.id, u.name ?? ""]));

    // WBS 항목 (담당자 또는 관리자)
    const wbsResults = await db.select().from(wbsItemsTable)
      .where(or(
        inArray(wbsItemsTable.assigneeId, userIds),
        inArray(wbsItemsTable.managerId, userIds)
      ))
      .limit(15);

    // 이슈 (담당자)
    const issueResults = await db.select().from(issuesTable)
      .where(inArray(issuesTable.assigneeId, userIds))
      .limit(10);

    let response = `[${assigneeName} 담당 업무 현황]\n`;

    if (wbsResults.length > 0) {
      response += `\n▶ WBS 항목 (${wbsResults.length}건)\n`;
      wbsResults.forEach((item) => {
        const level = LEVEL_KR[item.level] || item.level;
        const status = STATUS_KR[item.status] || item.status;
        response += `- [${item.wbsCode}] ${item.name} (${level}) | ${status} | ${item.progress}%\n`;
        response += `  계획: ${fmtDate(item.planStart)} ~ ${fmtDate(item.planEnd)}\n`;
      });
    } else {
      response += `\n▶ WBS 항목: 없음\n`;
    }

    if (issueResults.length > 0) {
      response += `\n▶ 담당 이슈 (${issueResults.length}건)\n`;
      issueResults.forEach((issue) => {
        const status = STATUS_KR[issue.status] || issue.status;
        response += `- [${status}] ${issue.title} (우선순위: ${issue.priority})\n`;
      });
    } else {
      response += `\n▶ 담당 이슈: 없음\n`;
    }

    return response;
  } catch (error) {
    console.error("Assignee Tasks Error:", error);
    return `담당자 업무 조회 오류: ${(error as Error).message}`;
  }
}

// --- 추가 도구: 프로젝트 진행 현황 요약 ---
export async function getProjectSummary(projectId: number): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "DB 접근 불가";

    const allItems = await db.select().from(wbsItemsTable)
      .where(eq(wbsItemsTable.projectId, projectId));

    if (allItems.length === 0) return `프로젝트 ID ${projectId}의 WBS 항목이 없습니다.`;

    const tasks = allItems.filter(i => i.level === "task");
    const activities = allItems.filter(i => i.level === "activity");
    const majors = allItems.filter(i => i.level === "major");

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
    const delayedTasks = tasks.filter(t => t.status === "delayed").length;
    const avgProgress = totalTasks > 0 ? (tasks.reduce((s, t) => s + (t.progress ?? 0), 0) / totalTasks).toFixed(1) : "0";

    // 이슈 현황
    const allIssues = await db.select().from(issuesTable)
      .where(eq(issuesTable.projectId, projectId));
    const openIssues = allIssues.filter(i => i.status === "open").length;
    const criticalIssues = allIssues.filter(i => i.priority === "critical" && i.status !== "closed").length;

    let response = `[프로젝트 진행 현황 요약]\n`;
    response += `\n▶ WBS 구조: 대공종 ${majors.length}개 | 액티비티 ${activities.length}개 | 테스크 ${totalTasks}개\n`;
    response += `▶ 테스크 현황: 완료 ${completedTasks} / 진행중 ${inProgressTasks} / 지연 ${delayedTasks} / 전체 ${totalTasks}\n`;
    response += `▶ 평균 진행률: ${avgProgress}%\n`;
    response += `▶ 이슈: 전체 ${allIssues.length}건 | 미해결 ${openIssues}건 | 긴급 ${criticalIssues}건\n`;

    // 대공종별 진행률
    if (majors.length > 0) {
      response += `\n▶ 대공종별 진행률\n`;
      majors.forEach(m => {
        response += `- [${m.wbsCode}] ${m.name}: ${m.progress}% (${STATUS_KR[m.status] || m.status})\n`;
      });
    }

    return response;
  } catch (error) {
    console.error("Project Summary Error:", error);
    return `프로젝트 요약 조회 오류: ${(error as Error).message}`;
  }
}

// --- Gemini Tools Definition ---

export const geminiTools: any[] = [
  {
    type: "function",
    function: {
      name: "searchWiki",
      description: "사내 Wiki (BookStack) 문서의 내용을 검색합니다. 검색 결과에는 문서 링크와 목차가 포함됩니다. 응답 시 반드시 마크다운 링크 형식 [문서명](URL)으로 제공하세요. 목차의 특정 섹션으로 이동하는 앵커 링크(#slug)가 포함되어 있으면 해당 링크를 사용하고, 사용자 질문과 더 관련 있는 목차 항목이 있다면 해당 항목의 slug를 URL 뒤에 #slug 형태로 붙여서 링크를 제공하세요.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "위키에서 검색할 핵심 키워드" },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchWbsItems",
      description: "PMS 프로젝트의 WBS(작업분류체계) 항목을 검색합니다. 대공종, 중공종, 소공종, 액티비티, 테스크를 키워드로 검색하여 일정, 진행률, 상태, 담당자, 관리자 정보를 조회합니다.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "WBS 작업명, 공종명, WBS코드 (예: 설계, 개발, 1-1-2)" },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkProjectIssues",
      description: "프로젝트 이슈(리스크, 결함, 요청, 질문)를 검색합니다. 이슈 유형, 우선순위, 상태, 담당자, 연결된 WBS 항목, 처리내용을 포함합니다.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "검색할 이슈 키워드 (예: 서버 오류, 결함, 지연)" },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getWbsChildren",
      description: "특정 WBS 항목의 하위 항목(자식 공종/액티비티/테스크)을 조회합니다. 상위 공종의 하위 구조를 파악할 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          wbsCode: { type: "string", description: "조회할 상위 WBS 코드 (예: 1, 1-1, 1-1-2)" },
        },
        required: ["wbsCode"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTasksByAssignee",
      description: "특정 담당자의 업무 현황을 조회합니다. 해당 담당자에게 배정된 WBS 항목과 이슈를 모두 보여줍니다.",
      parameters: {
        type: "object",
        properties: {
          assigneeName: { type: "string", description: "담당자 이름 (예: 홍길동, 김)" },
        },
        required: ["assigneeName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProjectSummary",
      description: "프로젝트 전체 진행 현황을 요약합니다. WBS 구조, 테스크 완료/진행/지연 현황, 평균 진행률, 이슈 현황, 대공종별 진행률을 제공합니다.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "number", description: "프로젝트 ID (기본값 1)" },
        },
        required: [],
      },
    },
  },
];

export async function executeTool(name: string, argsText: string): Promise<string> {
  let args: any = {};
  try {
    args = JSON.parse(argsText);
  } catch (e) {
    return "Invalid arguments format";
  }

  if (name === "searchWiki") {
    return await searchWiki(args.keyword || "");
  } else if (name === "searchWbsItems") {
    return await searchWbsItems(args.keyword || "");
  } else if (name === "checkProjectIssues") {
    return await checkProjectIssues(args.keyword || "");
  } else if (name === "getWbsChildren") {
    return await getWbsChildren(args.wbsCode || "");
  } else if (name === "getTasksByAssignee") {
    return await getTasksByAssignee(args.assigneeName || "");
  } else if (name === "getProjectSummary") {
    return await getProjectSummary(args.projectId || 1);
  }

  return `Unknown tool function: ${name}`;
}
