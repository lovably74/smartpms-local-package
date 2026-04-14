import { describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

async function loadRouterWithLocalEnv() {
  vi.resetModules();
  process.env.VITE_APP_ID = "local";
  process.env.ALLOW_LOCAL_LOGIN = "1";
  process.env.JWT_SECRET = "test-secret";
  return import("./routers");
}

describe("auth.localLogin", () => {
  it("issues local session cookie in local mode", async () => {
    const setCookies: Array<{ name: string; value: string }> = [];
    const { appRouter } = await loadRouterWithLocalEnv();

    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string) => {
          setCookies.push({ name, value });
          return {} as never;
        },
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.localLogin();

    expect(result.success).toBe(true);
    expect(setCookies.length).toBe(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  }, 15000);
});
