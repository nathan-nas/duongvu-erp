import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

import {
  createImportBatch,
  insertSpendLinesChunk,
  markImportBatchFailed,
  SPEND_LINE_CHUNK,
} from "./import-spend";

describe("import spend server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication before creating a batch", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createImportBatch({
        source_filename: "chi-tiet.xlsx",
        period_year: 2026,
        batch_kind: "annual",
        fact_rows: 2,
        amount_sum: 100,
      }),
    ).resolves.toEqual({ error: "Bạn cần đăng nhập." });

    expect(from).not.toHaveBeenCalled();
  });

  it("only inserts lines when the batch belongs to the authenticated user", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const userIdFilter = vi.fn(() => ({ maybeSingle }));
    const batchIdFilter = vi.fn(() => ({ eq: userIdFilter }));
    from.mockReturnValue({
      select: vi.fn(() => ({ eq: batchIdFilter })),
    });

    await expect(
      insertSpendLinesChunk("another-users-batch", []),
    ).resolves.toEqual({ error: "Không lưu được dữ liệu." });

    expect(from).toHaveBeenCalledWith("import_batch");
    expect(batchIdFilter).toHaveBeenCalledWith("id", "another-users-batch");
    expect(userIdFilter).toHaveBeenCalledWith("user_id", "user-1");
    expect(from).not.toHaveBeenCalledWith("spend_line");
  });

  it("uses the documented chunk size", () => {
    expect(SPEND_LINE_CHUNK).toBe(400);
  });

  it("marks an owned batch as failed", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const userIdFilter = vi.fn().mockResolvedValue({ error: null });
    const batchIdFilter = vi.fn(() => ({ eq: userIdFilter }));
    const update = vi.fn(() => ({ eq: batchIdFilter }));
    from.mockReturnValue({ update });

    await expect(markImportBatchFailed("batch-1")).resolves.toEqual({
      error: null,
    });

    expect(from).toHaveBeenCalledWith("import_batch");
    expect(update).toHaveBeenCalledWith({ status: "failed" });
    expect(batchIdFilter).toHaveBeenCalledWith("id", "batch-1");
    expect(userIdFilter).toHaveBeenCalledWith("user_id", "user-1");
  });
});
