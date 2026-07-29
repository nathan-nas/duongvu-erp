import { describe, expect, it } from "vitest";
import { extractPeriodYearFromFilename } from "./period-year";

describe("extractPeriodYearFromFilename", () => {
  it("reads year from annual filename", () => {
    expect(
      extractPeriodYearFromFilename("TH CHI TIẾT NĂM 2025 (HOAI) (1).xlsx"),
    ).toBe(2025);
  });
  it("reads year from VAT TU filename", () => {
    expect(extractPeriodYearFromFilename("VAT TU T12-2025 (HOAI).xlsx")).toBe(
      2025,
    );
  });
  it("returns null when missing", () => {
    expect(extractPeriodYearFromFilename("bao-cao.xlsx")).toBeNull();
  });
});
