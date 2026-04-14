import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * 배포 tarball 에 smartpms/.env 가 들어가면 원격 압축 해제 시 서버 DB 설정이 덮어씌워진다.
 * deploy-to-ubuntu.ps1 의 exclude·검증 로직이 유지되는지 스모크 검사한다.
 */
describe("deploy-to-ubuntu.ps1 tarball policy", () => {
  it("excludes server env files from tar and verifies archive contents", () => {
    const ps1Path = path.resolve(import.meta.dirname, "..", "..", "scripts", "deploy-to-ubuntu.ps1");
    const src = readFileSync(ps1Path, "utf8");
    expect(src).toContain("--exclude=smartpms/.env");
    expect(src).toContain("smartpms/.env.local");
    expect(src).toContain("smartpms/.env.production.local");
    expect(src).toContain("배포 tarball에");
    expect(src).toContain("forbidden");
  });
});
