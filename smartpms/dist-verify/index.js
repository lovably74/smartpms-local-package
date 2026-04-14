var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  attachments: () => attachments,
  issueAttachments: () => issueAttachments,
  issueComments: () => issueComments,
  issues: () => issues,
  notifications: () => notifications,
  projects: () => projects,
  users: () => users,
  wbsItems: () => wbsItems
});
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
  date
} from "drizzle-orm/mysql-core";
var users, projects, wbsItems, attachments, issues, issueComments, issueAttachments, notifications;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      phone: varchar("phone", { length: 20 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    projects = mysqlTable("projects", {
      id: int("id").autoincrement().primaryKey(),
      code: varchar("code", { length: 20 }).notNull().unique(),
      name: varchar("name", { length: 200 }).notNull(),
      description: text("description"),
      status: mysqlEnum("status", ["active", "completed", "paused"]).default("active").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    wbsItems = mysqlTable("wbs_items", {
      id: int("id").autoincrement().primaryKey(),
      projectId: int("projectId").notNull(),
      wbsCode: varchar("wbsCode", { length: 50 }).notNull(),
      level: mysqlEnum("level", ["major", "middle", "minor", "activity", "task"]).notNull(),
      parentId: int("parentId"),
      sortOrder: int("sortOrder").default(0).notNull(),
      name: varchar("name", { length: 300 }).notNull(),
      category: varchar("category", { length: 50 }),
      // 담당자/관리자
      assigneeId: int("assigneeId"),
      // 테스크/액티비티 담당자
      managerId: int("managerId"),
      // 대공종/중공종/소공종 관리자
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    attachments = mysqlTable("attachments", {
      id: int("id").autoincrement().primaryKey(),
      wbsItemId: int("wbsItemId").notNull(),
      uploaderId: int("uploaderId").notNull(),
      fileName: varchar("fileName", { length: 255 }).notNull(),
      fileKey: varchar("fileKey", { length: 500 }).notNull(),
      fileUrl: text("fileUrl").notNull(),
      mimeType: varchar("mimeType", { length: 100 }),
      fileSize: bigint("fileSize", { mode: "number" }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    issues = mysqlTable("issues", {
      id: int("id").autoincrement().primaryKey(),
      projectId: int("projectId").notNull(),
      wbsItemId: int("wbsItemId"),
      // 연결된 WBS 항목
      title: varchar("title", { length: 300 }).notNull(),
      description: text("description"),
      type: mysqlEnum("type", ["risk", "defect", "request", "question", "other"]).default("other").notNull(),
      priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
      status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
      reporterId: int("reporterId").notNull(),
      assigneeId: int("assigneeId"),
      dueDate: date("dueDate"),
      resolvedAt: timestamp("resolvedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    issueComments = mysqlTable("issue_comments", {
      id: int("id").autoincrement().primaryKey(),
      issueId: int("issueId").notNull(),
      authorId: int("authorId").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    issueAttachments = mysqlTable("issue_attachments", {
      id: int("id").autoincrement().primaryKey(),
      issueId: int("issueId").notNull(),
      uploaderId: int("uploaderId").notNull(),
      fileName: varchar("fileName", { length: 255 }).notNull(),
      fileKey: varchar("fileKey", { length: 500 }).notNull(),
      fileUrl: text("fileUrl").notNull(),
      mimeType: varchar("mimeType", { length: 100 }),
      fileSize: bigint("fileSize", { mode: "number" }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    notifications = mysqlTable("notifications", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import os from "os";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
init_schema();
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// server/_core/env.ts
function buildDatabaseUrlFromParts() {
  const host = process.env.DB_HOST?.trim();
  const port = process.env.DB_PORT?.trim() || "3306";
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const name = process.env.DB_NAME?.trim();
  if (!host || !user || !name) return "";
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}`;
}
var databaseUrl = process.env.DATABASE_URL?.trim() || buildDatabaseUrlFromParts();
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "local-admin",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "phone"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(asc(projects.id));
}
async function getProjectById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}
async function getWbsItemsByProject(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wbsItems).where(eq(wbsItems.projectId, projectId)).orderBy(asc(wbsItems.sortOrder), asc(wbsItems.id));
}
async function getWbsItemById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(wbsItems).where(eq(wbsItems.id, id)).limit(1);
  return result[0];
}
async function updateWbsItem(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(wbsItems).set(data).where(eq(wbsItems.id, id));
}
async function getAttachmentsByWbsItem(wbsItemId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attachments).where(eq(attachments.wbsItemId, wbsItemId));
}
async function createAttachment(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(attachments).values(data);
}
async function getIssuesByProject(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(issues).where(eq(issues.projectId, projectId)).orderBy(desc(issues.createdAt));
}
async function getIssueById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  return result[0];
}
async function updateIssue(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(issues).set(data).where(eq(issues.id, id));
}
async function getIssuesByWbsItem(wbsItemId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(issues).where(eq(issues.wbsItemId, wbsItemId));
}
async function getCommentsByIssue(issueId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(issueComments).where(eq(issueComments.issueId, issueId)).orderBy(asc(issueComments.createdAt));
}
async function createComment(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(issueComments).values(data);
}
async function getNotificationsByUser(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function markNotificationRead(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}
async function markAllNotificationsRead(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
async function getUnreadNotificationCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(asc(users.name));
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function getIssueStats(projectId) {
  const db = await getDb();
  if (!db) return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  const allIssues = await db.select().from(issues).where(eq(issues.projectId, projectId));
  return {
    total: allIssues.length,
    open: allIssues.filter((i) => i.status === "open").length,
    inProgress: allIssues.filter((i) => i.status === "in_progress").length,
    resolved: allIssues.filter((i) => i.status === "resolved").length,
    closed: allIssues.filter((i) => i.status === "closed").length
  };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // HTTP 로컬 환경에서는 SameSite=None 쿠키가 브라우저에서 거부되므로 Lax로 강제한다.
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/wbsUtils.ts
init_schema();
import { eq as eq2 } from "drizzle-orm";
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = String(val);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Date.UTC(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
async function recalculateProgress(projectId) {
  const db = await getDb();
  if (!db) return;
  const allItems = await getWbsItemsByProject(projectId);
  const levels = ["task", "activity", "minor", "middle", "major"];
  for (const level of levels) {
    if (level === "task") continue;
    const levelItems = allItems.filter((i) => i.level === level);
    for (const item of levelItems) {
      const children = allItems.filter((i) => i.parentId === item.id);
      if (children.length === 0) continue;
      const avgProgress = children.reduce((sum, c) => sum + (c.progress || 0), 0) / children.length;
      const roundedProgress = Math.round(avgProgress * 100) / 100;
      let status = "not_started";
      if (roundedProgress >= 100) status = "completed";
      else if (roundedProgress > 0) status = "in_progress";
      const childStarts = children.map((c) => toDate(c.planStart)).filter(Boolean);
      const childEnds = children.map((c) => toDate(c.planEnd)).filter(Boolean);
      const planStart = childStarts.length > 0 ? new Date(Math.min(...childStarts.map((d) => d.getTime()))) : toDate(item.planStart);
      const planEnd = childEnds.length > 0 ? new Date(Math.max(...childEnds.map((d) => d.getTime()))) : toDate(item.planEnd);
      const updateData = {
        progress: roundedProgress,
        status
      };
      if (planStart) updateData.planStart = planStart;
      if (planEnd) updateData.planEnd = planEnd;
      await db.update(wbsItems).set(updateData).where(eq2(wbsItems.id, item.id));
      const idx = allItems.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        allItems[idx].progress = roundedProgress;
        allItems[idx].status = status;
        if (planStart) allItems[idx].planStart = planStart;
        if (planEnd) allItems[idx].planEnd = planEnd;
      }
    }
  }
}
async function adjustSuccessorSchedules(projectId, changedItemId, daysDiff) {
  if (daysDiff === 0) return;
  const db = await getDb();
  if (!db) return;
  const allItems = await getWbsItemsByProject(projectId);
  const changedItem = allItems.find((i) => i.id === changedItemId);
  if (!changedItem || !changedItem.successorCode) return;
  const visited = /* @__PURE__ */ new Set();
  const queue = [changedItem.successorCode];
  while (queue.length > 0) {
    const code = queue.shift();
    if (!code || code === "-") continue;
    const item = allItems.find((i) => i.wbsCode === code && i.projectId === projectId);
    if (!item || visited.has(item.id)) continue;
    visited.add(item.id);
    const startDate = toDate(item.planStart);
    const endDate = toDate(item.planEnd);
    const newStart = startDate ? shiftDate(startDate, daysDiff) : null;
    const newEnd = endDate ? shiftDate(endDate, daysDiff) : null;
    const updateData = {};
    if (newStart) updateData.planStart = newStart;
    if (newEnd) updateData.planEnd = newEnd;
    if (Object.keys(updateData).length > 0) {
      await db.update(wbsItems).set(updateData).where(eq2(wbsItems.id, item.id));
    }
    if (item.successorCode && item.successorCode !== "-") {
      queue.push(item.successorCode);
    }
  }
}
function shiftDate(date2, days) {
  const d = new Date(date2.getTime());
  d.setDate(d.getDate() + days);
  return d;
}
function dateDiffInDays(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1e3 * 60 * 60 * 24));
}

// server/notificationService.ts
init_schema();
async function sendEmail(to, subject, body) {
  try {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!apiUrl || !apiKey) {
      console.warn("[Email] API credentials not available");
      return false;
    }
    const response = await fetch(`${apiUrl}/v1/notification/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ to, subject, body })
    });
    if (!response.ok) {
      console.warn("[Email] Failed to send:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Error sending email:", err);
    return false;
  }
}
async function sendSMS(to, message) {
  try {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!apiUrl || !apiKey) {
      console.warn("[SMS] API credentials not available");
      return false;
    }
    const response = await fetch(`${apiUrl}/v1/notification/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ to, message })
    });
    if (!response.ok) {
      console.warn("[SMS] Failed to send:", response.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[SMS] Error sending SMS:", err);
    return false;
  }
}
async function sendNotification(opts) {
  const db = await getDb();
  if (!db) return;
  let emailSent = false;
  let smsSent = false;
  if (opts.userEmail) {
    const emailBody = `
\uC548\uB155\uD558\uC138\uC694, ${opts.userName || "\uB2F4\uB2F9\uC790"}\uB2D8.

SmartPMS\uC5D0\uC11C \uC0C8\uB85C\uC6B4 \uC54C\uB9BC\uC774 \uC788\uC2B5\uB2C8\uB2E4.

[${opts.title}]
${opts.content || ""}

SmartPMS \uC2DC\uC2A4\uD15C\uC5D0\uC11C \uC790\uB3D9 \uBC1C\uC1A1\uB41C \uBA54\uC77C\uC785\uB2C8\uB2E4.
    `.trim();
    emailSent = await sendEmail(opts.userEmail, `[SmartPMS] ${opts.title}`, emailBody);
  }
  if (opts.userPhone) {
    const smsMessage = `[SmartPMS] ${opts.title}`;
    smsSent = await sendSMS(opts.userPhone, smsMessage);
  }
  await db.insert(notifications).values({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    content: opts.content,
    relatedIssueId: opts.relatedIssueId,
    relatedWbsId: opts.relatedWbsId,
    emailSent,
    smsSent
  });
}
async function notifyIssueCreated(opts) {
  if (!opts.assignee) return;
  await sendNotification({
    userId: opts.assignee.id,
    userEmail: opts.assignee.email,
    userPhone: opts.assignee.phone,
    userName: opts.assignee.name,
    type: "issue_created",
    title: `\uC0C8 \uC774\uC288 \uBC30\uC815: ${opts.issue.title}`,
    content: `${opts.reporter?.name || "\uB2F4\uB2F9\uC790"}\uB2D8\uC774 \uC774\uC288\uB97C \uB4F1\uB85D\uD558\uACE0 \uADC0\uD558\uB97C \uB2F4\uB2F9\uC790\uB85C \uC9C0\uC815\uD588\uC2B5\uB2C8\uB2E4.
\uC774\uC288: ${opts.issue.title}`,
    relatedIssueId: opts.issue.id,
    relatedWbsId: opts.issue.wbsItemId ?? void 0
  });
}
async function notifyIssueStatusChanged(opts) {
  if (!opts.assignee) return;
  const statusMap = {
    open: "\uBBF8\uD574\uACB0",
    in_progress: "\uC9C4\uD589\uC911",
    resolved: "\uD574\uACB0\uB428",
    closed: "\uC885\uB8CC"
  };
  const statusLabel = statusMap[opts.issue.status] || opts.issue.status;
  await sendNotification({
    userId: opts.assignee.id,
    userEmail: opts.assignee.email,
    userPhone: opts.assignee.phone,
    userName: opts.assignee.name,
    type: "issue_status_changed",
    title: `\uC774\uC288 \uC0C1\uD0DC \uBCC0\uACBD: ${opts.issue.title} \u2192 ${statusLabel}`,
    content: `${opts.changedBy?.name || "\uB2F4\uB2F9\uC790"}\uB2D8\uC774 \uC774\uC288 \uC0C1\uD0DC\uB97C "${statusLabel}"\uB85C \uBCC0\uACBD\uD588\uC2B5\uB2C8\uB2E4.`,
    relatedIssueId: opts.issue.id
  });
}
async function notifyIssueComment(opts) {
  if (!opts.assignee) return;
  await sendNotification({
    userId: opts.assignee.id,
    userEmail: opts.assignee.email,
    userPhone: opts.assignee.phone,
    userName: opts.assignee.name,
    type: "issue_comment",
    title: `\uC774\uC288 \uB313\uAE00: ${opts.issue.title}`,
    content: `${opts.commenter?.name || "\uB2F4\uB2F9\uC790"}\uB2D8\uC774 \uB313\uAE00\uC744 \uB0A8\uACBC\uC2B5\uB2C8\uB2E4.
"${opts.comment.substring(0, 100)}${opts.comment.length > 100 ? "..." : ""}"`,
    relatedIssueId: opts.issue.id
  });
}

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/routers.ts
import { nanoid } from "nanoid";
init_schema();
import { eq as eq3 } from "drizzle-orm";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    localLogin: publicProcedure.mutation(async ({ ctx }) => {
      if (ENV.isProduction || ENV.appId !== "local") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Local login is disabled" });
      }
      const openId = ENV.ownerOpenId || "local-owner-001";
      const name = ENV.ownerName || "local-admin";
      await upsertUser({
        openId,
        name,
        email: null,
        loginMethod: "local",
        role: "admin",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const user = await getUserByOpenId(openId);
      return { success: true, user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ===== Projects =====
  projects: router({
    list: publicProcedure.query(async () => {
      return getProjects();
    }),
    get: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getProjectById(input.id);
    })
  }),
  // ===== WBS =====
  wbs: router({
    list: publicProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ input }) => {
      return getWbsItemsByProject(input.projectId);
    }),
    get: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getWbsItemById(input.id);
    }),
    updateProgress: protectedProcedure.input(z2.object({
      id: z2.number(),
      progress: z2.number().min(0).max(100),
      projectId: z2.number()
    })).mutation(async ({ input }) => {
      let status = "not_started";
      if (input.progress >= 100) status = "completed";
      else if (input.progress > 0) status = "in_progress";
      const updateData = { progress: input.progress, status };
      if (input.progress > 0) {
        const existing = await getWbsItemById(input.id);
        if (!existing?.actualStart) {
          updateData.actualStart = /* @__PURE__ */ new Date();
        }
      }
      await updateWbsItem(input.id, updateData);
      await recalculateProgress(input.projectId);
      return { success: true };
    }),
    updateSchedule: protectedProcedure.input(z2.object({
      id: z2.number(),
      projectId: z2.number(),
      planStart: z2.string().optional(),
      planEnd: z2.string().optional()
    })).mutation(async ({ input }) => {
      const current = await getWbsItemById(input.id);
      if (!current) throw new Error("WBS item not found");
      const oldEnd = current.planEnd ? String(current.planEnd).substring(0, 10) : null;
      const newEnd = input.planEnd;
      await updateWbsItem(input.id, {
        planStart: input.planStart,
        planEnd: input.planEnd
      });
      if (oldEnd && newEnd && oldEnd !== newEnd) {
        const daysDiff = dateDiffInDays(oldEnd, newEnd);
        await adjustSuccessorSchedules(input.projectId, input.id, daysDiff);
      }
      await recalculateProgress(input.projectId);
      return { success: true };
    }),
    updateAssignee: protectedProcedure.input(z2.object({
      id: z2.number(),
      assigneeId: z2.number().nullable()
    })).mutation(async ({ input }) => {
      await updateWbsItem(input.id, { assigneeId: input.assigneeId ?? void 0 });
      return { success: true };
    }),
    updateManager: protectedProcedure.input(z2.object({
      id: z2.number(),
      managerId: z2.number().nullable()
    })).mutation(async ({ input }) => {
      await updateWbsItem(input.id, { managerId: input.managerId ?? void 0 });
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["not_started", "in_progress", "completed", "delayed", "on_hold"]),
      projectId: z2.number()
    })).mutation(async ({ input }) => {
      await updateWbsItem(input.id, { status: input.status });
      await recalculateProgress(input.projectId);
      return { success: true };
    }),
    getAttachments: publicProcedure.input(z2.object({ wbsItemId: z2.number() })).query(async ({ input }) => {
      return getAttachmentsByWbsItem(input.wbsItemId);
    }),
    updateNotes: protectedProcedure.input(z2.object({
      id: z2.number(),
      notes: z2.string()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(wbsItems).set({ notes: input.notes }).where(eq3(wbsItems.id, input.id));
      return { success: true };
    }),
    deleteAttachment: protectedProcedure.input(z2.object({
      attachmentId: z2.number()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(attachments).where(eq3(attachments.id, input.attachmentId));
      return { success: true };
    }),
    // 인라인 편집: 항목 이름/일정/담당자 수정
    updateItem: protectedProcedure.input(z2.object({
      id: z2.number(),
      projectId: z2.number(),
      name: z2.string().optional(),
      planStart: z2.string().nullable().optional(),
      planEnd: z2.string().nullable().optional(),
      assigneeId: z2.number().nullable().optional()
    })).mutation(async ({ input }) => {
      const updateData = {};
      if (input.name !== void 0) updateData.name = input.name;
      if (input.planStart !== void 0) updateData.planStart = input.planStart ? new Date(input.planStart) : null;
      if (input.planEnd !== void 0) updateData.planEnd = input.planEnd ? new Date(input.planEnd) : null;
      if (input.assigneeId !== void 0) updateData.assigneeId = input.assigneeId;
      await updateWbsItem(input.id, updateData);
      await recalculateProgress(input.projectId);
      return { success: true };
    }),
    // 인라인 편집: 새 항목 추가
    createItem: protectedProcedure.input(z2.object({
      projectId: z2.number(),
      parentId: z2.number().nullable(),
      level: z2.enum(["major", "middle", "minor", "activity", "task"]),
      name: z2.string(),
      planStart: z2.string().nullable().optional(),
      planEnd: z2.string().nullable().optional(),
      assigneeId: z2.number().nullable().optional(),
      sortOrder: z2.number().optional()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const siblings = await db.select().from(wbsItems).where(input.parentId ? eq3(wbsItems.parentId, input.parentId) : eq3(wbsItems.projectId, input.projectId));
      const maxSort = siblings.reduce((m, s) => Math.max(m, s.sortOrder || 0), 0);
      const newSort = maxSort + 10;
      let wbsCode = `NEW-${Date.now()}`;
      if (input.parentId) {
        const parent = await db.select().from(wbsItems).where(eq3(wbsItems.id, input.parentId)).limit(1);
        if (parent[0]) {
          wbsCode = `${parent[0].wbsCode}-${siblings.length + 1}`;
        }
      } else {
        const roots = await db.select().from(wbsItems).where(eq3(wbsItems.projectId, input.projectId));
        const majorRoots = roots.filter((r) => !r.parentId);
        wbsCode = `${majorRoots.length + 1}`;
      }
      const [result] = await db.insert(wbsItems).values({
        projectId: input.projectId,
        parentId: input.parentId ?? void 0,
        level: input.level,
        name: input.name,
        wbsCode,
        sortOrder: newSort,
        planStart: input.planStart ? new Date(input.planStart) : void 0,
        planEnd: input.planEnd ? new Date(input.planEnd) : void 0,
        assigneeId: input.assigneeId ?? void 0,
        status: "not_started",
        progress: 0
      });
      return { success: true, insertId: result.insertId };
    }),
    // 인라인 편집: 항목 삭제 (하위 항목 포함)
    deleteItem: protectedProcedure.input(z2.object({
      id: z2.number(),
      projectId: z2.number()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const allItems = await db.select().from(wbsItems).where(eq3(wbsItems.projectId, input.projectId));
      const collectIds = (id) => {
        const children = allItems.filter((i) => i.parentId === id);
        return [id, ...children.flatMap((c) => collectIds(c.id))];
      };
      const idsToDelete = collectIds(input.id);
      const { inArray: inArray2 } = await import("drizzle-orm");
      await db.delete(wbsItems).where(inArray2(wbsItems.id, idsToDelete));
      await recalculateProgress(input.projectId);
      return { success: true, deletedCount: idsToDelete.length };
    }),
    uploadFile: protectedProcedure.input(z2.object({
      wbsItemId: z2.number(),
      fileName: z2.string(),
      fileData: z2.string(),
      // base64
      mimeType: z2.string(),
      fileSize: z2.number()
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const fileKey = `wbs-files/${input.wbsItemId}/${nanoid()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      await createAttachment({
        wbsItemId: input.wbsItemId,
        uploaderId: ctx.user.id,
        fileName: input.fileName,
        fileKey,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: input.fileSize
      });
      return { url, fileKey };
    })
  }),
  // ===== Issues =====
  issues: router({
    list: publicProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ input }) => {
      return getIssuesByProject(input.projectId);
    }),
    get: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getIssueById(input.id);
    }),
    getByWbs: publicProcedure.input(z2.object({ wbsItemId: z2.number() })).query(async ({ input }) => {
      return getIssuesByWbsItem(input.wbsItemId);
    }),
    // 해당 WBS 항목 및 모든 하위 항목의 이슈 취합
    getByWbsTree: publicProcedure.input(z2.object({ wbsItemId: z2.number(), projectId: z2.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const allItems = await db.select().from(wbsItems).where(eq3(wbsItems.projectId, input.projectId));
      const collectIds = (id) => {
        const children = allItems.filter((i) => i.parentId === id);
        return [id, ...children.flatMap((c) => collectIds(c.id))];
      };
      const ids = collectIds(input.wbsItemId);
      const { issues: issuesTable } = (init_schema(), __toCommonJS(schema_exports));
      const { inArray: inArray2 } = __require("drizzle-orm");
      return db.select().from(issuesTable).where(inArray2(issuesTable.wbsItemId, ids));
    }),
    create: protectedProcedure.input(z2.object({
      projectId: z2.number(),
      wbsItemId: z2.number().optional(),
      title: z2.string().min(1),
      description: z2.string().optional(),
      type: z2.enum(["risk", "defect", "request", "question", "other"]).default("other"),
      priority: z2.enum(["critical", "high", "medium", "low"]).default("medium"),
      assigneeId: z2.number().optional(),
      dueDate: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const result = await db.insert((init_schema(), __toCommonJS(schema_exports)).issues).values({
        projectId: input.projectId,
        wbsItemId: input.wbsItemId,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        status: "open",
        reporterId: ctx.user.id,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate
      });
      if (input.assigneeId) {
        const assignee = await getUserById(input.assigneeId);
        await notifyIssueCreated({
          issue: { id: result[0]?.insertId || 0, title: input.title, wbsItemId: input.wbsItemId },
          assignee: assignee ? { id: assignee.id, email: assignee.email, phone: assignee.phone, name: assignee.name } : null,
          reporter: ctx.user
        });
      }
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string().optional(),
      description: z2.string().optional(),
      type: z2.enum(["risk", "defect", "request", "question", "other"]).optional(),
      priority: z2.enum(["critical", "high", "medium", "low"]).optional(),
      status: z2.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      assigneeId: z2.number().nullable().optional(),
      dueDate: z2.string().nullable().optional()
    })).mutation(async ({ input, ctx }) => {
      const issue = await getIssueById(input.id);
      if (!issue) throw new Error("Issue not found");
      const updateData = {};
      if (input.title !== void 0) updateData.title = input.title;
      if (input.description !== void 0) updateData.description = input.description;
      if (input.type !== void 0) updateData.type = input.type;
      if (input.priority !== void 0) updateData.priority = input.priority;
      if (input.assigneeId !== void 0) updateData.assigneeId = input.assigneeId;
      if (input.dueDate !== void 0) updateData.dueDate = input.dueDate;
      if (input.status !== void 0 && input.status !== issue.status) {
        updateData.status = input.status;
        if (input.status === "resolved") updateData.resolvedAt = /* @__PURE__ */ new Date();
        if (issue.assigneeId) {
          const assignee = await getUserById(issue.assigneeId);
          await notifyIssueStatusChanged({
            issue: { id: issue.id, title: issue.title, status: input.status },
            assignee: assignee ? { id: assignee.id, email: assignee.email, phone: assignee.phone, name: assignee.name } : null,
            changedBy: ctx.user
          });
        }
      }
      await updateIssue(input.id, updateData);
      return { success: true };
    }),
    stats: publicProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ input }) => {
      return getIssueStats(input.projectId);
    }),
    // 댓글
    comments: router({
      list: publicProcedure.input(z2.object({ issueId: z2.number() })).query(async ({ input }) => {
        return getCommentsByIssue(input.issueId);
      }),
      create: protectedProcedure.input(z2.object({
        issueId: z2.number(),
        content: z2.string().min(1)
      })).mutation(async ({ input, ctx }) => {
        await createComment({ issueId: input.issueId, authorId: ctx.user.id, content: input.content });
        const issue = await getIssueById(input.issueId);
        if (issue?.assigneeId && issue.assigneeId !== ctx.user.id) {
          const assignee = await getUserById(issue.assigneeId);
          await notifyIssueComment({
            issue: { id: issue.id, title: issue.title },
            assignee: assignee ? { id: assignee.id, email: assignee.email, phone: assignee.phone, name: assignee.name } : null,
            commenter: ctx.user,
            comment: input.content
          });
        }
        return { success: true };
      })
    })
  }),
  // ===== Notifications =====
  notifications: router({
    list: protectedProcedure.input(z2.object({ limit: z2.number().default(50) })).query(async ({ ctx, input }) => {
      return getNotificationsByUser(ctx.user.id, input.limit);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    })
  }),
  // ===== Users =====
  users: router({
    list: publicProcedure.query(async () => {
      return getAllUsers();
    }),
    updateProfile: protectedProcedure.input(z2.object({
      phone: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { users: usersTable } = (init_schema(), __toCommonJS(schema_exports));
      await db.update(usersTable).set({ phone: input.phone }).where(eq3(usersTable.id, ctx.user.id));
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    // 로컬 IP(예: 192.168.x.x)로 접속 시 Host 검증 통과
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    // 미들웨어 모드에서도 LAN IP 접속 시 HMR이 현재 호스트를 따르도록
    host: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
function getLanAccessUrls(port) {
  const urls = [];
  const interfaces = os.networkInterfaces();
  for (const infos of Object.values(interfaces)) {
    if (!infos) continue;
    for (const info of infos) {
      if (info.family !== "IPv4" || info.internal) continue;
      urls.push(`http://${info.address}:${port}/`);
    }
  }
  return urls;
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  const listenHost = process.env.HOST ?? "0.0.0.0";
  server.listen(port, listenHost, () => {
    console.log(`Server running on http://localhost:${port}/`);
    const lanUrls = getLanAccessUrls(port);
    if (lanUrls.length > 0) {
      console.log("LAN (same subnet):");
      for (const url of lanUrls) {
        console.log(`  ${url}`);
      }
    }
  });
}
startServer().catch(console.error);
