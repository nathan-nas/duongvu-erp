import { describe, expect, it } from "vitest";
import { formatImportBatchLabel } from "./batch-label";

describe("formatImportBatchLabel", () => {
  it("formats annual as year summary from payment dates", () => {
    expect(
      formatImportBatchLabel({
        batch_kind: "annual",
        period_year: 2025,
        payment_date_min: "2025-01-05",
        payment_date_max: "2025-12-20",
      }),
    ).toBe("Tổng hợp năm 2025");
  });

  it("formats period as a single ngay when min equals max", () => {
    expect(
      formatImportBatchLabel({
        batch_kind: "period",
        period_year: 2025,
        payment_date_min: "2025-10-02",
        payment_date_max: "2025-10-02",
      }),
    ).toBe("02/10/2025");
  });

  it("formats period as a ngay range", () => {
    expect(
      formatImportBatchLabel({
        batch_kind: "period",
        period_year: 2025,
        payment_date_min: "2025-10-02",
        payment_date_max: "2025-10-31",
      }),
    ).toBe("02/10/2025 – 31/10/2025");
  });

  it("falls back to period_year when dates are missing", () => {
    expect(
      formatImportBatchLabel({
        batch_kind: "unknown",
        period_year: 2026,
        payment_date_min: null,
        payment_date_max: null,
      }),
    ).toBe("Năm 2026");
  });
});
