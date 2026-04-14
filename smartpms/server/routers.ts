import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getProjects, getProjectById, getWbsItemsByProject, getWbsItemById,
  updateWbsItem, getAllUsers, getUserById,   getAttachmentsByWbsItem, getAttachmentCountsByProject,
  createAttachment, getIssuesByProject, getIssueById, createIssue,
  updateIssue, getIssuesByWbsItem, getCommentsByIssue, createComment, getUserByOpenId,
  getNotificationsByUser, markNotificationRead, markAllNotificationsRead,
  getUnreadNotificationCount, getIssueStats, upsertUser,
} from "./db";
import { recalculateProgress, adjustSuccessorSchedules, dateDiffInDays } from "./wbsUtils";
import { notifyIssueCreated, notifyIssueStatusChanged, notifyIssueComment } from "./notificationService";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { projects, wbsItems as wbsItemsTable, attachments as attachmentsTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { toSqlDateString } from "./_core/date";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure.mutation(async ({ ctx }) => {
      // 로컬 모드 + 명시적 허용 플래그에서만 우회 로그인 허용
      if (ENV.appId !== "local" || !ENV.allowLocalLogin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Local login is disabled" });
      }

      const openId = ENV.ownerOpenId || "local-owner-001";
      const name = ENV.ownerName || "local-admin";
      await upsertUser({
        openId,
        name,
        email: null,
        loginMethod: "local",
        role: "admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const user = await getUserByOpenId(openId);
      return { success: true, user } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== Projects =====
  projects: router({
    list: publicProcedure.query(async () => {
      return getProjects();
    }),
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getProjectById(input.id);
    }),
  }),

  // ===== WBS =====
  wbs: router({
    list: publicProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return getWbsItemsByProject(input.projectId);
    }),

    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getWbsItemById(input.id);
    }),

     updateProgress: protectedProcedure.input(z.object({
      id: z.number(),
      progress: z.number().min(0).max(100),
      projectId: z.number(),
    })).mutation(async ({ input }) => {
      const existing = await getWbsItemById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "WBS item not found" });

      let status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold' = 'not_started';
      if (input.progress >= 100) status = 'completed';
      else if (input.progress > 0) status = 'in_progress';

      const updateData: Record<string, unknown> = { progress: input.progress, status };

      if (existing.level === 'task') {
        if (input.progress === 0) {
          updateData.actualStart = null;
        } else if (input.progress >= 100) {
          updateData.actualStart = toSqlDateString(new Date());
        } else {
          const prevProg = existing.progress ?? 0;
          const wasNotStarted = existing.status === 'not_started';
          if (prevProg === 0 || wasNotStarted) {
            updateData.actualStart = toSqlDateString(new Date());
          }
        }
      } else {
        if (input.progress > 0 && !existing.actualStart) {
          updateData.actualStart = toSqlDateString(new Date());
        }
      }

      await updateWbsItem(input.id, updateData as any);
      await recalculateProgress(input.projectId);
      return { success: true };
    }),

    updateSchedule: protectedProcedure.input(z.object({
      id: z.number(),
      projectId: z.number(),
      planStart: z.string().optional(),
      planEnd: z.string().optional(),
    })).mutation(async ({ input }) => {
      const current = await getWbsItemById(input.id);
      if (!current) throw new Error('WBS item not found');

      const oldEnd = current.planEnd ? String(current.planEnd).substring(0, 10) : null;
      const newEnd = input.planEnd;

      await updateWbsItem(input.id, {
        planStart: input.planStart as unknown as Date,
        planEnd: input.planEnd as unknown as Date,
      });

      // 후속작업 일정 자동 조정
      if (oldEnd && newEnd && oldEnd !== newEnd) {
        const daysDiff = dateDiffInDays(oldEnd, newEnd);
        await adjustSuccessorSchedules(input.projectId, input.id, daysDiff);
      }

      await recalculateProgress(input.projectId);
      return { success: true };
    }),

    updateAssignee: protectedProcedure.input(z.object({
      id: z.number(),
      assigneeId: z.number().nullable(),
    })).mutation(async ({ input }) => {
      await updateWbsItem(input.id, { assigneeId: input.assigneeId ?? undefined });
      return { success: true };
    }),

    updateManager: protectedProcedure.input(z.object({
      id: z.number(),
      managerId: z.number().nullable(),
    })).mutation(async ({ input }) => {
      await updateWbsItem(input.id, { managerId: input.managerId ?? undefined });
      return { success: true };
    }),

    /** 테스크만: 미시작(0%)·진행중(50%)·완료(100%) 및 실행일 반영 */
    setTaskProgressStatus: protectedProcedure.input(z.object({
      id: z.number(),
      projectId: z.number(),
      status: z.enum(['not_started', 'in_progress', 'completed']),
    })).mutation(async ({ input }) => {
      const item = await getWbsItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "WBS item not found" });
      if (item.level !== 'task') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "진행상태 선택은 테스크만 가능합니다" });
      }
      const progress = input.status === 'not_started' ? 0 : input.status === 'in_progress' ? 50 : 100;
      const updateData: Record<string, unknown> = {
        status: input.status,
        progress,
        actualStart: input.status === 'not_started' ? null : toSqlDateString(new Date()),
      };
      await updateWbsItem(input.id, updateData as any);
      await recalculateProgress(input.projectId);
      return { success: true };
    }),

    getAttachments: publicProcedure.input(z.object({ wbsItemId: z.number() })).query(async ({ input }) => {
      return getAttachmentsByWbsItem(input.wbsItemId);
    }),

    attachmentCountsByProject: publicProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return getAttachmentCountsByProject(input.projectId);
    }),

    updateNotes: protectedProcedure.input(z.object({
      id: z.number(),
      notes: z.string(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      await db.update(wbsItemsTable).set({ notes: input.notes }).where(eq(wbsItemsTable.id, input.id));
      return { success: true };
    }),
    deleteAttachment: protectedProcedure.input(z.object({
      attachmentId: z.number(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      await db.delete(attachmentsTable).where(eq(attachmentsTable.id, input.attachmentId));
      return { success: true };
    }),
    // 인라인 편집: 항목 이름/일정/담당자 수정
    updateItem: protectedProcedure.input(z.object({
      id: z.number(),
      projectId: z.number(),
      name: z.string().optional(),
      planStart: z.string().nullable().optional(),
      planEnd: z.string().nullable().optional(),
      assigneeId: z.number().nullable().optional(),
    })).mutation(async ({ input }) => {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.planStart !== undefined) updateData.planStart = input.planStart ? new Date(input.planStart) : null;
      if (input.planEnd !== undefined) updateData.planEnd = input.planEnd ? new Date(input.planEnd) : null;
      if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
      await updateWbsItem(input.id, updateData);
      await recalculateProgress(input.projectId);
      return { success: true };
    }),
    // 인라인 편집: 새 항목 추가
    createItem: protectedProcedure.input(z.object({
      projectId: z.number(),
      parentId: z.number().nullable(),
      level: z.enum(['major', 'middle', 'minor', 'activity', 'task']),
      name: z.string(),
      planStart: z.string().nullable().optional(),
      planEnd: z.string().nullable().optional(),
      assigneeId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      // wbsCode 자동 생성: 같은 부모 하위에서 최대 sortOrder 기반
      const siblings = await db.select().from(wbsItemsTable)
        .where(input.parentId ? eq(wbsItemsTable.parentId, input.parentId) : eq(wbsItemsTable.projectId, input.projectId));
      const maxSort = siblings.reduce((m: number, s: any) => Math.max(m, s.sortOrder || 0), 0);
      const newSort = maxSort + 10;
      // 부모의 wbsCode를 기반으로 새 코드 생성
      let wbsCode = `NEW-${Date.now()}`;
      if (input.parentId) {
        const parent = await db.select().from(wbsItemsTable).where(eq(wbsItemsTable.id, input.parentId)).limit(1);
        if (parent[0]) {
          wbsCode = `${parent[0].wbsCode}-${siblings.length + 1}`;
        }
      } else {
        const roots = await db.select().from(wbsItemsTable)
          .where(eq(wbsItemsTable.projectId, input.projectId));
        const majorRoots = roots.filter((r: any) => !r.parentId);
        wbsCode = `${majorRoots.length + 1}`;
      }
      const [result] = await db.insert(wbsItemsTable).values({
        projectId: input.projectId,
        parentId: input.parentId ?? undefined,
        level: input.level,
        name: input.name,
        wbsCode,
        sortOrder: newSort,
        planStart: input.planStart ? new Date(input.planStart) as any : undefined,
        planEnd: input.planEnd ? new Date(input.planEnd) as any : undefined,
        assigneeId: input.assigneeId ?? undefined,
        status: 'not_started',
        progress: 0,
      });
      return { success: true, insertId: (result as any).insertId };
    }),
    // 인라인 편집: 항목 삭제 (하위 항목 포함)
    deleteItem: protectedProcedure.input(z.object({
      id: z.number(),
      projectId: z.number(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      // 하위 항목 ID 수집 후 재귀 삭제
      const allItems = await db.select().from(wbsItemsTable).where(eq(wbsItemsTable.projectId, input.projectId));
      const collectIds = (id: number): number[] => {
        const children = allItems.filter((i: any) => i.parentId === id);
        return [id, ...children.flatMap((c: any) => collectIds(c.id))];
      };
      const idsToDelete = collectIds(input.id);
      const { inArray } = await import('drizzle-orm');
      await db.delete(wbsItemsTable).where(inArray(wbsItemsTable.id, idsToDelete));
      await recalculateProgress(input.projectId);
      return { success: true, deletedCount: idsToDelete.length };
    }),
    uploadFile: protectedProcedure.input(z.object({
      wbsItemId: z.number(),
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
      fileSize: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileData, 'base64');
      const fileKey = `wbs-files/${input.wbsItemId}/${nanoid()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      await createAttachment({
        wbsItemId: input.wbsItemId,
        uploaderId: ctx.user.id,
        fileName: input.fileName,
        fileKey,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      });
      return { url, fileKey };
    }),
  }),

  // ===== Issues =====
  issues: router({
    list: publicProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return getIssuesByProject(input.projectId);
    }),

    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getIssueById(input.id);
    }),

    getByWbs: publicProcedure.input(z.object({ wbsItemId: z.number() })).query(async ({ input }) => {
      return getIssuesByWbsItem(input.wbsItemId);
    }),
    // 해당 WBS 항목 및 모든 하위 항목의 이슈 취합
    getByWbsTree: publicProcedure.input(z.object({ wbsItemId: z.number(), projectId: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // 해당 항목의 모든 하위 항목 ID 수집
      const allItems = await db.select().from(wbsItemsTable).where(eq(wbsItemsTable.projectId, input.projectId));
      const collectIds = (id: number): number[] => {
        const children = allItems.filter(i => i.parentId === id);
        return [id, ...children.flatMap(c => collectIds(c.id))];
      };
      const ids = collectIds(input.wbsItemId);
      const { issues: issuesTable } = require('../drizzle/schema');
      const { inArray } = require('drizzle-orm');
      return db.select().from(issuesTable).where(inArray(issuesTable.wbsItemId, ids));
    }),

    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      wbsItemId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(['risk', 'defect', 'request', 'question', 'other']).default('other'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
      assigneeId: z.number().optional(),
      dueDate: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');

      const result = await db.insert(require('../drizzle/schema').issues).values({
        projectId: input.projectId,
        wbsItemId: input.wbsItemId,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        status: 'open',
        reporterId: ctx.user.id,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate as unknown as Date,
      });

      // 담당자 알림
      if (input.assigneeId) {
        const assignee = await getUserById(input.assigneeId);
        await notifyIssueCreated({
          issue: { id: (result as any)[0]?.insertId || 0, title: input.title, wbsItemId: input.wbsItemId },
          assignee: assignee ? { id: assignee.id, email: assignee.email, phone: assignee.phone, name: assignee.name } : null,
          reporter: ctx.user,
        });
      }

      return { success: true };
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      type: z.enum(['risk', 'defect', 'request', 'question', 'other']).optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      assigneeId: z.number().nullable().optional(),
      dueDate: z.string().nullable().optional(),
      completedAt: z.string().nullable().optional(),
      resolutionContent: z.string().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const issue = await getIssueById(input.id);
      if (!issue) throw new Error('Issue not found');

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
      if (input.completedAt !== undefined) {
        updateData.completedAt = input.completedAt || null;
      }
      if (input.resolutionContent !== undefined) {
        updateData.resolutionContent = input.resolutionContent || null;
      }

      if (input.status !== undefined && input.status !== issue.status) {
        updateData.status = input.status;
        if (input.status === 'resolved') {
          const completedAt = input.completedAt || new Date().toISOString().slice(0, 10);
          const resolutionContent = input.resolutionContent?.trim();
          if (!resolutionContent) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "완료 처리 시 처리내용은 필수입니다." });
          }
          updateData.completedAt = completedAt;
          updateData.resolutionContent = resolutionContent;
          updateData.resolvedAt = new Date(`${completedAt}T00:00:00`);
        } else {
          // 완료 -> 미해결/처리중/종결 변경 시 완료정보 초기화
          updateData.completedAt = null;
          updateData.resolutionContent = null;
          updateData.resolvedAt = null;
        }

        // 상태 변경 알림
        if (issue.assigneeId) {
          const assignee = await getUserById(issue.assigneeId);
          await notifyIssueStatusChanged({
            issue: { id: issue.id, title: issue.title, status: input.status },
            assignee: assignee ? { id: assignee.id, email: assignee.email, phone: assignee.phone, name: assignee.name } : null,
            changedBy: ctx.user,
          });
        }
      }

      await updateIssue(input.id, updateData);
      return { success: true };
    }),

    stats: publicProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return getIssueStats(input.projectId);
    }),

    // 댓글
    comments: router({
      list: publicProcedure.input(z.object({ issueId: z.number() })).query(async ({ input }) => {
        return getCommentsByIssue(input.issueId);
      }),

      create: protectedProcedure.input(z.object({
        issueId: z.number(),
        content: z.string().min(1),
      })).mutation(async ({ input, ctx }) => {
        await createComment({ issueId: input.issueId, authorId: ctx.user.id, content: input.content });

        // 이슈 담당자에게 댓글 알림
        const issue = await getIssueById(input.issueId);
        if (issue?.assigneeId && issue.assigneeId !== ctx.user.id) {
          const assignee = await getUserById(issue.assigneeId);
          await notifyIssueComment({
            issue: { id: issue.id, title: issue.title },
            assignee: assignee ? { id: assignee.id, email: assignee.email, phone: assignee.phone, name: assignee.name } : null,
            commenter: ctx.user,
            comment: input.content,
          });
        }

        return { success: true };
      }),
    }),
  }),

  // ===== Notifications =====
  notifications: router({
    list: protectedProcedure.input(z.object({ limit: z.number().default(50) })).query(async ({ ctx, input }) => {
      return getNotificationsByUser(ctx.user.id, input.limit);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),

    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== Users =====
  users: router({
    list: publicProcedure.query(async () => {
      return getAllUsers();
    }),
    updateProfile: protectedProcedure.input(z.object({
      phone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const { users: usersTable } = require('../drizzle/schema');
      await db.update(usersTable).set({ phone: input.phone }).where(eq(usersTable.id, ctx.user.id));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
