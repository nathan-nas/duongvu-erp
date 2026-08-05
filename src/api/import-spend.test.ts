import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const from = vi.fn();
const storageFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
    storage: { from: storageFrom },
  })),
}));

vi.mock("@/lib/spend/parse-workbook", () => ({
  parseSpendWorkbook: vi.fn(() => ({
    sheetNames: ["V\u1eacT T\u01af NH\u00c0 M\u00c1Y", "V\u1eacT T\u01af XE"],
    hasFactSheet: true,
    missingSheetNames: [],
    unreadableSheetNames: [],
    sheetSummaries: [
      { sheetName: "V\u1eacT T\u01af NH\u00c0 M\u00c1Y", factRows: 1, amountSum: 100 },
      { sheetName: "V\u1eacT T\u01af XE", factRows: 0, amountSum: 0 },
    ],
    batchKind: "annual",
    suggestedPeriodYear: 2026,
    lines: [
      {
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
        unit_price: 100,
        amount: 100,
        plant_name: "NM1",
        expense_code: "C1",
        payment_method: null,
        description: null,
        invoice: null,
        note: null,
        recipient_name: null,
        quality_flags: [],
      },
    ],
    factRows: 1,
    amountSum: 100,
  })),
}));

import {
  createPendingBatch,
  markImportBatchFailed,
  prepareImport,
} from "./import-spend";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";

describe("import spend server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication before creating a pending batch", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createPendingBatch({
        source_filename: "chi-tiet.xlsx",
        period_year: 2026,
      }),
    ).resolves.toEqual({ error: "B\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp." });

    expect(from).not.toHaveBeenCalled();
  });

  it("creates a pending batch and returns storage path", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const single = vi.fn().mockResolvedValue({
      data: { id: "batch-1" },
      error: null,
    });
    const insertSelect = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select: insertSelect }));

    const updateEqUser = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({ eq: updateEqUser }));
    const update = vi.fn(() => ({ eq: updateEqId }));

    from.mockImplementation((table: string) => {
      if (table === "import_batch") {
        return { insert, update };
      }
      return {};
    });

    await expect(
      createPendingBatch({
        source_filename: "chi-tiet.xlsx",
        period_year: 2026,
      }),
    ).resolves.toEqual({
      batchId: "batch-1",
      storagePath: "user-1/batch-1/chi-tiet.xlsx",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        source_filename: "chi-tiet.xlsx",
        period_year: 2026,
      }),
    );
    expect(update).toHaveBeenCalledWith({
      storage_path: "user-1/batch-1/chi-tiet.xlsx",
    });
  });

  it("prepareImport fails when storage file is missing", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "batch-1",
        source_filename: "a.xlsx",
        period_year: 2026,
        storage_path: "user-1/batch-1/a.xlsx",
        status: "pending",
      },
      error: null,
    });
    const eqUser = vi.fn(() => ({ maybeSingle }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    from.mockReturnValue({
      select: vi.fn(() => ({ eq: eqId })),
    });

    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: { message: "missing" } }),
    });

    await expect(prepareImport("batch-1")).resolves.toEqual({
      error: "Ch\u01b0a t\u1ea3i l\u00ean file Excel.",
    });
  });

  it("uses the documented chunk size", () => {
    expect(SPEND_LINE_CHUNK).toBe(400);
  });

  it("marks an owned batch as failed and clears lines", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq: deleteEq }));

    const userIdFilter = vi.fn().mockResolvedValue({ error: null });
    const batchIdFilter = vi.fn(() => ({ eq: userIdFilter }));
    const update = vi.fn(() => ({ eq: batchIdFilter }));

    from.mockImplementation((table: string) => {
      if (table === "spend_line") return { delete: del };
      return { update };
    });

    await expect(markImportBatchFailed("batch-1")).resolves.toEqual({
      error: null,
    });

    expect(from).toHaveBeenCalledWith("spend_line");
    expect(from).toHaveBeenCalledWith("import_batch");
    expect(update).toHaveBeenCalledWith({ status: "failed" });
  });
});
