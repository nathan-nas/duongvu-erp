import { describe, expect, it } from "vitest";
import { formatItemLabel, formatPartyLabel, formatViDate, formatVnd } from "./format";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

describe("formatVnd", () => {
  it("formats amounts with vi-VN VND currency", () => {
    expect(formatVnd(0)).toBe(vndFormatter.format(0));
    expect(formatVnd(1234567)).toBe(vndFormatter.format(1234567));
    expect(formatVnd(-50000)).toBe(vndFormatter.format(-50000));
  });
});

describe("formatViDate", () => {
  it("formats ISO dates as dd/MM/yyyy", () => {
    expect(formatViDate("2025-12-04")).toBe("04/12/2025");
    expect(formatViDate("2025-01-09")).toBe("09/01/2025");
  });

  it("returns em dash for null or invalid input", () => {
    expect(formatViDate(null)).toBe("—");
    expect(formatViDate("")).toBe("—");
    expect(formatViDate("not-a-date")).toBe("—");
  });
});

describe("formatPartyLabel", () => {
  it("joins code and name with em dash", () => {
    expect(formatPartyLabel("N001", "Công ty X")).toBe("N001 — Công ty X");
  });

  it("uses em dash placeholder when one side is missing", () => {
    expect(formatPartyLabel("N001", null)).toBe("N001 — —");
    expect(formatPartyLabel(null, "Công ty X")).toBe("— — Công ty X");
    expect(formatPartyLabel("  ", "Công ty X")).toBe("— — Công ty X");
  });

  it("returns null when both sides are blank", () => {
    expect(formatPartyLabel(null, null)).toBeNull();
    expect(formatPartyLabel("", "")).toBeNull();
    expect(formatPartyLabel("  ", "  ")).toBeNull();
  });
});

describe("formatItemLabel", () => {
  it("matches party label rules for hàng hóa", () => {
    expect(formatItemLabel("HH01", "Gạo")).toBe("HH01 — Gạo");
    expect(formatItemLabel(null, "Gạo")).toBe("— — Gạo");
    expect(formatItemLabel("", "")).toBeNull();
  });
});
