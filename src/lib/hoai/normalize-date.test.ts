import { describe, expect, it } from "vitest";
import { parsePaymentDate } from "./normalize-date";

describe("parsePaymentDate", () => {
  it("parses DDMM number 412 as 2025-12-04", () => {
    const r = parsePaymentDate(412, 2025);
    expect(r.date).toBe("2025-12-04");
  });
  it("parses 1812 as 2025-12-18", () => {
    expect(parsePaymentDate(1812, 2025).date).toBe("2025-12-18");
  });
  it("keeps Excel Date objects", () => {
    const r = parsePaymentDate(new Date(2025, 11, 4), 2025);
    expect(r.date).toBe("2025-12-04");
  });
  it("flags invalid", () => {
    const r = parsePaymentDate("abc", 2025);
    expect(r.date).toBeNull();
    expect(r.flags).toContain("invalid_date");
  });
});
