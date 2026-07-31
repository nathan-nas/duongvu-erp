import { describe, expect, it } from "vitest";
import {
  extractPeriodMonthFromFilename,
  formatImportBatchLabel,
} from "./batch-label";

describe("extractPeriodMonthFromFilename", () => {
  it("reads month from TMM-YYYY pattern", () => {
    expect(extractPeriodMonthFromFilename("VAT TU T12-2025 (HOAI).xlsx")).toBe(
      12,
    );
    expect(extractPeriodMonthFromFilename("VAT TU T1-2026.xlsx")).toBe(1);
  });

  it("returns null when pattern is missing", () => {
    expect(extractPeriodMonthFromFilename("TH CHI TIẾT NĂM 2025.xlsx")).toBe(
      null,
    );
  });
});

describe("formatImportBatchLabel", () => {
  it("formats annual as year summary", () => {
    expect(
      formatImportBatchLabel({
        source_filename: "TH CHI TIẾT NĂM 2025 (HOAI).xlsx",
        period_year: 2025,
        batch_kind: "annual",
      }),
    ).toBe("Tổng hợp năm 2025");
  });

  it("formats period as month/year", () => {
    expect(
      formatImportBatchLabel({
        source_filename: "VAT TU T12-2025 (HOAI).xlsx",
        period_year: 2025,
        batch_kind: "period",
      }),
    ).toBe("Tháng 12/2025");
  });

  it("falls back for unknown kind", () => {
    expect(
      formatImportBatchLabel({
        source_filename: "random.xlsx",
        period_year: 2026,
        batch_kind: "unknown",
      }),
    ).toBe("Năm 2026");
  });
});
