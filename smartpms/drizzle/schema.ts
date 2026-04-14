import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  bigint,
  date,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 프로젝트 테이블
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "completed", "paused"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;

// WBS 항목 테이블 (대공종/중공종/소공종/액티비티/테스크 통합)
export const wbsItems = mysqlTable("wbs_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  wbsCode: varchar("wbsCode", { length: 50 }).notNull(),
  level: mysqlEnum("level", ["major", "middle", "minor", "activity", "task"]).notNull(),
  parentId: int("parentId"),
  sortOrder: int("sortOrder").default(0).notNull(),
  name: varchar("name", { length: 300 }).notNull(),
  category: varchar("category", { length: 50 }),
  // 담당자/관리자
  assigneeId: int("assigneeId"), // 테스크/액티비티 담당자
  managerId: int("managerId"),   // 대공종/중공종/소공종 관리자
  // 일정
  planStart: date("planStart"),
  planEnd: date("planEnd"),
  actualStart: date("actualStart"),
  actualEnd: date("actualEnd"),
  // 진행률 (테스크만 직접 입력, 상위는 계산)
  progress: float("progress").default(0).notNull(),
  // 선행/후속 공정 (WBS 코드 참조)
  predecessorCode: varchar("predecessorCode", { length: 50 }),
  successorCode: varchar("successorCode", { length: 50 }),
  // 상태
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "delayed", "on_hold"]).default("not_started").notNull(),
  // 작업 유형
  workType: varchar("workType", { length: 50 }),
  // 메모
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WbsItem = typeof wbsItems.$inferSelect;
export type InsertWbsItem = typeof wbsItems.$inferInsert;

// 파일 첨부 테이블
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  wbsItemId: int("wbsItemId").notNull(),
  uploaderId: int("uploaderId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;

// 이슈 테이블
export const issues = mysqlTable("issues", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  wbsItemId: int("wbsItemId"), // 연결된 WBS 항목
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["risk", "defect", "request", "question", "other"]).default("other").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  reporterId: int("reporterId").notNull(),
  assigneeId: int("assigneeId"),
  dueDate: date("dueDate"),
  resolvedAt: timestamp("resolvedAt"),
  completedAt: date("completedAt"),
  resolutionContent: text("resolutionContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;

// 이슈 댓글
export const issueComments = mysqlTable("issue_comments", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IssueComment = typeof issueComments.$inferSelect;

// 이슈 첨부파일
export const issueAttachments = mysqlTable("issue_attachments", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  uploaderId: int("uploaderId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// 알림 테이블
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["issue_created", "issue_comment", "issue_status_changed", "issue_assigned", "wbs_updated"]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content"),
  relatedIssueId: int("relatedIssueId"),
  relatedWbsId: int("relatedWbsId"),
  isRead: boolean("isRead").default(false).notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  smsSent: boolean("smsSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
