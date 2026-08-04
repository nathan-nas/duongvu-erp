import { describe, expect, it } from "vitest";
import { truncateTreemapLabel } from "./spend-treemap";

describe("truncateTreemapLabel", () => {
  it("returns the full label when it fits", () => {
    expect(truncateTreemapLabel("N001 — Công ty X", 40)).toBe(
      "N001 — Công ty X",
    );
  });

  it("prefers the mã when a composite label is too long", () => {
    expect(truncateTreemapLabel("N001 — Công ty rất dài tên", 12)).toBe(
      "N001",
    );
  });

  it("truncates a non-composite label with an ellipsis", () => {
    expect(truncateTreemapLabel("Nhà máy ABCDEF", 6)).toBe("Nhà m…");
  });
});
