import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("attachmentCountsByProject API", () => {
  it("routers expose wbs.attachmentCountsByProject and db exports getAttachmentCountsByProject", () => {
    const routersPath = path.resolve(import.meta.dirname, "routers.ts");
    const dbPath = path.resolve(import.meta.dirname, "db.ts");
    expect(readFileSync(routersPath, "utf8")).toContain("attachmentCountsByProject");
    expect(readFileSync(dbPath, "utf8")).toContain("getAttachmentCountsByProject");
  });
});
