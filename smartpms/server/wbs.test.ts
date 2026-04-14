import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAuthCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "demo-kim",
      email: "kim@smartpms.com",
      name: "김현장",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("projects.list", () => {
  it("returns list of projects", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("wbs.list", () => {
  it("returns wbs items for a project", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.wbs.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("issues.list", () => {
  it("returns issues for a project", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.issues.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("issues.stats", () => {
  it("returns issue statistics", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const stats = await caller.issues.stats({ projectId: 1 });
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("open");
    expect(stats).toHaveProperty("inProgress");
    expect(stats).toHaveProperty("resolved");
    expect(stats).toHaveProperty("closed");
  });
});

describe("users.list", () => {
  it("returns list of users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("notifications.unreadCount", () => {
  it("returns unread count for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const count = await caller.notifications.unreadCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("auth.logout", () => {
  it("clears session cookie", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "demo", email: "demo@test.com", name: "Test",
        loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => clearedCookies.push(name),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});
