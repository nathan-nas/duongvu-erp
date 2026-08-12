import { describe, expect, it } from "vitest";
import {
  isIsoDate,
  isoToLocalDate,
  localDateToIso,
  parseAnalyticsDateRange,
  parseViDateToIso,
  yearToDateRange,
} from "./date-range";

describe("isIsoDate", () => {
  it("accepts valid calendar dates", () => {
    expect(isIsoDate("2025-10-02")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isIsoDate("2025-13-01")).toBe(false);
    expect(isIsoDate("02/10/2025")).toBe(false);
  });
});

describe("isoToLocalDate / localDateToIso", () => {
  it("round-trips local calendar dates", () => {
    const date = isoToLocalDate("2025-10-02");
    expect(date).toBeInstanceOf(Date);
    expect(localDateToIso(date!)).toBe("2025-10-02");
  });
});

describe("parseViDateToIso", () => {
  it("parses dd/MM/yyyy", () => {
    expect(parseViDateToIso("02/10/2025")).toBe("2025-10-02");
    expect(parseViDateToIso("1/1/2026")).toBe("2026-01-01");
  });

  it("rejects invalid calendar or format", () => {
    expect(parseViDateToIso("32/01/2025")).toBeNull();
    expect(parseViDateToIso("2025-01-01")).toBeNull();
    expect(parseViDateToIso("")).toBeNull();
  });
});

describe("yearToDateRange", () => {
  it("returns 1 Jan of the year through today", () => {
    expect(yearToDateRange(new Date(2026, 7, 12))).toEqual({
      from: "2026-01-01",
      to: "2026-08-12",
    });
  });
});

describe("parseAnalyticsDateRange", () => {
  const bounds = { min: "2024-06-01", max: "2026-12-31" };
  const now = new Date(2026, 7, 12);

  it("defaults to year-to-date when params missing", () => {
    expect(parseAnalyticsDateRange(undefined, undefined, bounds, now)).toEqual({
      from: "2026-01-01",
      to: "2026-08-12",
      error: null,
    });
  });

  it("uses provided ISO params", () => {
    expect(
      parseAnalyticsDateRange("2025-12-01", "2025-12-31", bounds, now),
    ).toEqual({ from: "2025-12-01", to: "2025-12-31", error: null });
  });

  it("errors when from > to", () => {
    expect(
      parseAnalyticsDateRange("2025-12-01", "2025-01-01", bounds, now),
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
