import { describe, expect, it } from "vitest";
import { classifyBatchKind } from "./classify-batch";

describe("classifyBatchKind", () => {
  it("detects annual from filename", () => {
    expect(
      classifyBatchKind("TH CHI TIẾT NĂM 2025 (HOAI).xlsx", ["BANG CHI TIET"]),
    ).toBe("annual");
  });
  it("detects period from VAT TU", () => {
    expect(classifyBatchKind("VAT TU T12-2025 (HOAI).xlsx", ["MKH"])).toBe(
      "period",
    );
  });
});
