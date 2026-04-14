import { describe, expect, it } from "vitest";
import { toSqlDateString } from "./date";

describe("toSqlDateString", () => {
  it("returns YYYY-MM-DD format for SQL DATE column", () => {
    const result = toSqlDateString(new Date("2026-04-13T15:20:30.000Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.length).toBe(10);
  });
});
