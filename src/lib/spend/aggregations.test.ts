import { describe, expect, it } from "vitest";
import { sumBy, sumByMonth } from "./aggregations";

describe("sumBy", () => {
  it("groups non-empty labels, totals amounts, and sorts descending", () => {
    expect(
      sumBy(
        [
          { plant_name: "A", amount: 100, expense_code: "T1" },
          { plant_name: "A", amount: 50, expense_code: "T2" },
          { plant_name: "B", amount: 20, expense_code: "T1" },
          { plant_name: null, amount: 99, expense_code: "T3" },
        ],
        "plant_name",
      ),
    ).toEqual([
      { label: "A", amount: 150, count: 2 },
      { label: "B", amount: 20, count: 1 },
    ]);
  });

  it("limits the result when a top count is provided", () => {
    expect(
      sumBy(
        [
          { payment_method: "CK", amount: 100 },
          { payment_method: "TM", amount: 200 },
        ],
        "payment_method",
        1,
      ),
    ).toEqual([{ label: "TM", amount: 200, count: 1 }]);
  });
});

describe("sumByMonth", () => {
  it("groups valid payment dates by calendar month in chronological order", () => {
    expect(
      sumByMonth([
        { payment_date: "2025-12-04", amount: 100 },
        { payment_date: "2025-01-12", amount: 50 },
        { payment_date: "2025-12-18", amount: 20 },
        { payment_date: null, amount: 99 },
      ]),
    ).toEqual([
      { label: "2025-01", amount: 50, count: 1 },
      { label: "2025-12", amount: 120, count: 2 },
    ]);
  });
});
