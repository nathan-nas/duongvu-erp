import { describe, expect, it } from "vitest";
import {
  computeAmountSum,
  deserializeParsedLines,
  serializeParsedLines,
} from "./import-pipeline";
import type { SpendLineDraft } from "./types";
import {
  spendParsedStoragePath,
  spendWorkbookStoragePath,
} from "./storage-paths";

const sampleLine: SpendLineDraft = {
  payment_date: "2026-01-01",
  payment_date_raw: null,
  received_date: null,
  received_date_raw: null,
  party_code: null,
  party_name: "A",
  item_code: null,
  item_name: "Item",
  uom: null,
  qty: 1,
  unit_price: 50,
  amount: 50,
  plant_name: "NM1",
  expense_code: "C1",
  payment_method: null,
  description: null,
  invoice: null,
  note: null,
  recipient_name: null,
  quality_flags: [],
};

describe("import-pipeline", () => {
  it("computes amount sum from lines", () => {
    expect(computeAmountSum([sampleLine, { ...sampleLine, amount: 25 }])).toBe(
      75,
    );
    expect(computeAmountSum([{ ...sampleLine, amount: null }])).toBe(0);
  });

  it("round-trips serialized lines", () => {
    const raw = serializeParsedLines([sampleLine]);
    expect(deserializeParsedLines(raw)).toEqual([sampleLine]);
  });
});

describe("storage-paths", () => {
  it("builds user-scoped workbook and parsed paths", () => {
    expect(spendWorkbookStoragePath("u1", "b1", "chi.xlsx")).toBe(
      "u1/b1/chi.xlsx",
    );
    expect(spendParsedStoragePath("u1", "b1")).toBe("u1/b1/parsed.json");
  });
});
