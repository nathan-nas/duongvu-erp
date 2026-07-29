import { describe, expect, it } from "vitest";
import { mapFactRow } from "./map-fact-row";

describe("mapFactRow", () => {
  it("maps a material line", () => {
    const row = mapFactRow(
      [412, "NM90", "THIÊN NAM PHÁT", "CÁI", "DB77", "DÂY CUROA B77", 6, 53000, 318000, "mua", "KHO", "MÁY CÁM", "t53", "A", null, "TM", "HD1", ""],
      2025,
    );
    expect(row?.expense_code).toBe("T53");
    expect(row?.amount).toBe(318000);
    expect(row?.plant_name).toBe("MÁY CÁM");
    expect(row?.payment_date).toBe("2025-12-04");
  });
  it("returns null for empty row", () => {
    expect(mapFactRow([], 2025)).toBeNull();
  });
  it("flags amount mismatch", () => {
    const row = mapFactRow(
      [412, "X", "Y", null, null, "Z", 2, 100, 999, null, null, "NM", "T01", null, null, "TM", null, null],
      2025,
    );
    expect(row?.quality_flags).toContain("amount_mismatch");
  });
});
