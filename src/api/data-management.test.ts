import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, from, rpc, storageFrom, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  storageFrom: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
    rpc,
    storage: { from: storageFrom },
  })),
}));

import {
  deleteImportBatch,
  deleteSpendLinesByDateRange,
  listImportBatches,
  previewDeleteByDateRange,
} from "./data-management";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";

describe("data management server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listImportBatches rejects unauthenticated caller", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(listImportBatches()).resolves.toEqual({
      error: "Bạn cần đăng nhập.",
    });

    expect(from).not.toHaveBeenCalled();
  });

  it("listImportBatches returns mapped rows on success", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "batch-1",
          source_filename: "chi-tiet.xlsx",
          period_year: 2026,
          batch_kind: "annual",
          fact_rows: 10,
          amount_sum: 1000,
          status: "ready",
          created_at: "2026-01-01T00:00:00Z",
          storage_path: "user-1/batch-1/chi-tiet.xlsx",
        },
      ],
      error: null,
    });
    const eqUser = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq: eqUser }));

    from.mockReturnValue({ select });

    await expect(listImportBatches()).resolves.toEqual({
      batches: [
        {
          id: "batch-1",
          source_filename: "chi-tiet.xlsx",
          period_year: 2026,
          batch_kind: "annual",
          fact_rows: 10,
          amount_sum: 1000,
          status: "ready",
          created_at: "2026-01-01T00:00:00Z",
          storage_path: "user-1/batch-1/chi-tiet.xlsx",
        },
      ],
    });
  });

  it("previewDeleteByDateRange rejects invalid ISO dates", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    await expect(
      previewDeleteByDateRange({ from: "bad", to: "2026-01-01" }),
    ).resolves.toEqual({ error: "Ngày không hợp lệ." });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("previewDeleteByDateRange returns preview numbers from RPC", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    rpc.mockResolvedValue({
      data: [
        {
          row_count: 5,
          amount_sum: 500,
          batch_count_touched: 2,
        },
      ],
      error: null,
    });

    await expect(
      previewDeleteByDateRange({ from: "2026-01-01", to: "2026-01-31" }),
    ).resolves.toEqual({
      rowCount: 5,
      amountSum: 500,
      batchCountTouched: 2,
    });

    expect(rpc).toHaveBeenCalledWith("spend_delete_preview", {
      p_from: "2026-01-01",
      p_to: "2026-01-31",
    });
  });

  it("deleteImportBatch rejects unauthenticated caller", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(deleteImportBatch("batch-1")).resolves.toEqual({
      error: "Bạn cần đăng nhập.",
    });
  });

  it("deleteImportBatch deletes batch and best-effort removes storage", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "batch-1",
        storage_path: "user-1/batch-1/file.xlsx",
        parsed_path: "user-1/batch-1/parsed.json",
      },
      error: null,
    });
    const eqUserRead = vi.fn(() => ({ maybeSingle }));
    const eqIdRead = vi.fn(() => ({ eq: eqUserRead }));

    const deleteEqUser = vi.fn().mockResolvedValue({ error: null });
    const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }));
    const del = vi.fn(() => ({ eq: deleteEqId }));

    from.mockReturnValue({
      select: vi.fn(() => ({ eq: eqIdRead })),
      delete: del,
    });

    const remove = vi.fn().mockResolvedValue({ error: null });
    storageFrom.mockReturnValue({ remove });

    await expect(deleteImportBatch("batch-1")).resolves.toEqual({ ok: true });

    expect(del).toHaveBeenCalled();
    expect(deleteEqId).toHaveBeenCalledWith("id", "batch-1");
    expect(deleteEqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(remove).toHaveBeenCalledWith([
      "user-1/batch-1/file.xlsx",
      "user-1/batch-1/parsed.json",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/app/data");
    expect(revalidatePath).toHaveBeenCalledWith("/app/analytics");
  });

  it("deleteSpendLinesByDateRange loops until chunk exhausted then prunes", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    rpc
      .mockResolvedValueOnce({ data: SPEND_LINE_CHUNK, error: null })
      .mockResolvedValueOnce({ data: 50, error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: "batch-2",
            storage_path: "user-1/batch-2/file.xlsx",
            parsed_path: "user-1/batch-2/parsed.json",
          },
        ],
        error: null,
      });

    const remove = vi.fn().mockResolvedValue({ error: null });
    storageFrom.mockReturnValue({ remove });

    await expect(
      deleteSpendLinesByDateRange({ from: "2026-01-01", to: "2026-01-31" }),
    ).resolves.toEqual({
      ok: true,
      deletedRows: SPEND_LINE_CHUNK + 50,
      prunedBatches: 1,
    });

    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc).toHaveBeenNthCalledWith(1, "spend_delete_by_date_range", {
      p_from: "2026-01-01",
      p_to: "2026-01-31",
      p_limit: SPEND_LINE_CHUNK,
    });
    expect(rpc).toHaveBeenNthCalledWith(3, "spend_prune_empty_batches");
    expect(remove).toHaveBeenCalledWith([
      "user-1/batch-2/file.xlsx",
      "user-1/batch-2/parsed.json",
    ]);
  });

  it("deleteSpendLinesByDateRange swallows storage errors without failing", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    rpc
      .mockResolvedValueOnce({ data: 10, error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: "batch-3",
            storage_path: "user-1/batch-3/file.xlsx",
            parsed_path: null,
          },
        ],
        error: null,
      });

    const remove = vi.fn().mockRejectedValue(new Error("storage down"));
    storageFrom.mockReturnValue({ remove });

    await expect(
      deleteSpendLinesByDateRange({ from: "2026-01-01", to: "2026-01-31" }),
    ).resolves.toEqual({
      ok: true,
      deletedRows: 10,
      prunedBatches: 1,
    });
  });
});
