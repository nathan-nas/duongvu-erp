import { describe, expect, it } from "vitest";
import { isIsoDate, parseAnalyticsDateRange } from "./date-range";

describe("isIsoDate", () => {
  it("accepts valid calendar dates", () => {
    expect(isIsoDate("2025-10-02")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isIsoDate("2025-13-01")).toBe(false);
    expect(isIsoDate("02/10/2025")).toBe(false);
  });
});

describe("parseAnalyticsDateRange", () => {
  it("uses defaults when params missing", () => {
    expect(
      parseAnalyticsDateRange(undefined, undefined, {
        min: "2025-01-01",
        max: "2025-12-31",
      }),
    ).toEqual({ from: "2025-01-01", to: "2025-12-31", error: null });
  });

  it("errors when from > to", () => {
    expect(
      parseAnalyticsDateRange("2025-12-01", "2025-01-01", {
        min: "2025-01-01",
        max: "2025-12-31",
      }),
    ).toEqual({
      from: "2025-12-01",
      to: "2025-01-01",
      error: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
    });
  });

  it("errors when no data bounds", () => {
    expect(
      parseAnalyticsDateRange(undefined, undefined, { min: null, max: null }),
    ).toEqual({
      from: null,
      to: null,
      error: "Chưa có dữ liệu giao dịch.",
    });
  });
});
