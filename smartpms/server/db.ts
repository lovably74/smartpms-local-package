import { eq, and, inArray, desc, asc, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, projects, wbsItems, attachments,
  issues, issueComments, issueAttachments, notifications,
  WbsItem, InsertWbsItem, Issue, InsertIssue
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Projects =====
export async function getProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(asc(projects.id));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

// ===== WBS Items =====
export async function getWbsItemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wbsItems)
    .where(eq(wbsItems.projectId, projectId))
    .orderBy(asc(wbsItems.sortOrder), asc(wbsItems.id));
}

export async function getWbsItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wbsItems).where(eq(wbsItems.id, id)).limit(1);
  return result[0];
}

export async function updateWbsItem(id: number, data: Partial<InsertWbsItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(wbsItems).set(data).where(eq(wbsItems.id, id));
}

export async function getWbsItemByCode(projectId: number, code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wbsItems)
    .where(and(eq(wbsItems.projectId, projectId), eq(wbsItems.wbsCode, code)))
    .limit(1);
  return result[0];
}

// 자식 WBS 항목 조회
export async function getWbsChildren(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wbsItems)
    .where(eq(wbsItems.parentId, parentId))
    .orderBy(asc(wbsItems.sortOrder));
}

// ===== Attachments =====
export async function getAttachmentsByWbsItem(wbsItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attachments).where(eq(attachments.wbsItemId, wbsItemId));
}

/** 프로젝트 내 테스크 행에 연결된 첨부파일 개수 (WBS 그리드 뱃지용) */
export async function getAttachmentCountsByProject(projectId: number): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db
    .select({
      wbsItemId: attachments.wbsItemId,
      cnt: sql<number>`count(*)`.mapWith(Number),
    })
    .from(attachments)
    .innerJoin(wbsItems, eq(attachments.wbsItemId, wbsItems.id))
    .where(and(eq(wbsItems.projectId, projectId), eq(wbsItems.level, "task")))
    .groupBy(attachments.wbsItemId);
  const out: Record<number, number> = {};
  for (const r of rows) {
    out[r.wbsItemId] = r.cnt;
  }
  return out;
}

export async function createAttachment(data: {
  wbsItemId: number; uploaderId: number; fileName: string;
  fileKey: string; fileUrl: string; mimeType?: string; fileSize?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(attachments).values(data);
}

// ===== Issues =====
export async function getIssuesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(issues)
    .where(eq(issues.projectId, projectId))
    .orderBy(desc(issues.createdAt));
}

export async function getIssueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  return result[0];
}

export async function createIssue(data: InsertIssue) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(issues).values(data);
  return result[0];
}

export async function updateIssue(id: number, data: Partial<InsertIssue>) {
  const db = await getDb();
  if (!db) return;
  await db.update(issues).set(data).where(eq(issues.id, id));
}

export async function getIssuesByWbsItem(wbsItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(issues).where(eq(issues.wbsItemId, wbsItemId));
}

// ===== Issue Comments =====
export async function getCommentsByIssue(issueId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(issueComments)
    .where(eq(issueComments.issueId, issueId))
    .orderBy(asc(issueComments.createdAt));
}

export async function createComment(data: { issueId: number; authorId: number; content: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(issueComments).values(data);
}

// ===== Notifications =====
export async function getNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function createNotification(data: {
  userId: number; type: typeof notifications.$inferInsert['type'];
  title: string; content?: string; relatedIssueId?: number; relatedWbsId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ===== Users =====
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(asc(users.name));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ===== Issue Stats =====
export async function getIssueStats(projectId: number) {
  const db = await getDb();
  if (!db) return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  const allIssues = await db.select().from(issues).where(eq(issues.projectId, projectId));
  return {
    total: allIssues.length,
    open: allIssues.filter(i => i.status === 'open').length,
    inProgress: allIssues.filter(i => i.status === 'in_progress').length,
    resolved: allIssues.filter(i => i.status === 'resolved').length,
    closed: allIssues.filter(i => i.status === 'closed').length,
  };
}
