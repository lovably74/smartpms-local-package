import { afterAll, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

async function loadEnvModule() {
  vi.resetModules();
  return import("./env");
}

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("ENV.databaseUrl", () => {
  it("uses DATABASE_URL first when provided", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: "mysql://direct:user@127.0.0.1:3306/direct_db",
      DB_HOST: "10.10.10.30",
      DB_PORT: "3306",
      DB_USER: "smartcon",
      DB_PASSWORD: "pw",
      DB_NAME: "smartpms",
    };

    const { ENV } = await loadEnvModule();
    expect(ENV.databaseUrl).toBe("mysql://direct:user@127.0.0.1:3306/direct_db");
  });

  it("builds URL from DB_* vars when DATABASE_URL is empty", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: "",
      DB_HOST: "10.10.10.30",
      DB_PORT: "3306",
      DB_USER: "smartcon",
      DB_PASSWORD: "pw!@#",
      DB_NAME: "smartpms",
    };

    const { ENV } = await loadEnvModule();
    expect(ENV.databaseUrl).toBe("mysql://smartcon:pw!%40%23@10.10.10.30:3306/smartpms");
  });

  it("returns empty when required DB_* vars are missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: "",
      DB_HOST: "",
      DB_PORT: "3306",
      DB_USER: "smartcon",
      DB_PASSWORD: "pw",
      DB_NAME: "smartpms",
    };

    const { ENV } = await loadEnvModule();
    expect(ENV.databaseUrl).toBe("");
  });
});
