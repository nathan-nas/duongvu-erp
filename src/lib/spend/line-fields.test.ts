import { describe, expect, it } from "vitest";
import { resolveAmount, emptySpendLineFields } from "./line-fields";

describe("line-fields", () => {
  it("uses explicit amount when set", () => {
    expect(
      resolveAmount({
        ...emptySpendLineFields(),
        qty: 2,
        unit_price: 10,
        amount: 99,
      }),
    ).toBe(99);
  });

  it("falls back to qty * unit_price", () => {
    expect(
      resolveAmount({
        ...emptySpendLineFields(),
        qty: 2,
        unit_price: 10,
        amount: null,
      }),
    ).toBe(20);
  });
});
