import { describe, expect, it } from "vitest";
import { normalizeRollupStatus, rollupStatusFromChildren } from "./wbsUtils";

describe("rollupStatusFromChildren", () => {
  it("전부 미시작이면 미시작", () => {
    expect(
      rollupStatusFromChildren([{ status: "not_started" }, { status: "not_started" }])
    ).toBe("not_started");
  });

  it("전부 완료면 완료", () => {
    expect(
      rollupStatusFromChildren([{ status: "completed" }, { status: "completed" }])
    ).toBe("completed");
  });

  it("하나라도 진행중이면 진행중", () => {
    expect(
      rollupStatusFromChildren([
        { status: "not_started" },
        { status: "in_progress" },
      ])
    ).toBe("in_progress");
  });

  it("미시작과 완료 혼합은 진행중", () => {
    expect(
      rollupStatusFromChildren([{ status: "not_started" }, { status: "completed" }])
    ).toBe("in_progress");
  });

  it("지연·보류는 진행중으로 취급", () => {
    expect(normalizeRollupStatus("delayed")).toBe("in_progress");
    expect(normalizeRollupStatus("on_hold")).toBe("in_progress");
    expect(
      rollupStatusFromChildren([{ status: "not_started" }, { status: "delayed" }])
    ).toBe("in_progress");
  });
});
