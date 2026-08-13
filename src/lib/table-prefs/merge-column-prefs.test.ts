import { describe, expect, it } from "vitest";
import { clampWidth, mergeColumnPrefs } from "./merge-column-prefs";

const COLS = [
  { id: "a", defaultWidth: 100, minWidth: 50, maxWidth: 200 },
  { id: "b", defaultWidth: 120 },
  { id: "c", defaultWidth: 80, hideable: false },
] as const;

describe("mergeColumnPrefs", () => {
  it("returns defaults when saved is null", () => {
    const result = mergeColumnPrefs(COLS, null);
    expect(result.columnOrder).toEqual(["a", "b", "c"]);
    expect(result.visibleIds).toEqual(["a", "b", "c"]);
    expect(result.widths).toEqual({ a: 100, b: 120, c: 80 });
  });

  it("drops unknown ids and appends new columns", () => {
    const result = mergeColumnPrefs(COLS, {
      columnOrder: ["b", "gone", "a"],
      visibleIds: ["b", "gone"],
      widths: { b: 150, gone: 99 },
    });
    expect(result.columnOrder).toEqual(["b", "a", "c"]);
    expect(result.visibleIds).toContain("b");
    expect(result.visibleIds).toContain("c"); // non-hideable
    expect(result.visibleIds).not.toContain("gone");
    expect(result.widths.b).toBe(150);
    expect(result.widths.a).toBe(100);
  });

  it("falls back when visible list is empty", () => {
    const result = mergeColumnPrefs(COLS, {
      columnOrder: ["a", "b", "c"],
      visibleIds: [],
      widths: {},
    });
    expect(result.visibleIds).toEqual(["a", "b", "c"]);
  });
});

describe("clampWidth", () => {
  it("clamps to min/max and rounds", () => {
    expect(clampWidth(10, { minWidth: 50, maxWidth: 200 })).toBe(50);
    expect(clampWidth(999, { minWidth: 50, maxWidth: 200 })).toBe(200);
    expect(clampWidth(123.6, { minWidth: 50, maxWidth: 200 })).toBe(124);
  });
});
