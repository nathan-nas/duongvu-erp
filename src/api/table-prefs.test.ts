import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, from } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

import { getTableColumnPrefs, upsertTableColumnPrefs } from "./table-prefs";

describe("table-prefs server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTableColumnPrefs rejects unauthenticated caller", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getTableColumnPrefs("spend_lines")).resolves.toEqual({
      error: "Bạn cần đăng nhập.",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("getTableColumnPrefs rejects unknown table id", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    await expect(getTableColumnPrefs("nope")).resolves.toEqual({
      error: "Bảng không hợp lệ.",
    });
  });

  it("upsertTableColumnPrefs writes row", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });

    await expect(
      upsertTableColumnPrefs("import_batches", {
        columnOrder: ["filename", "year"],
        visibleIds: ["filename", "year"],
        widths: { filename: 200, year: 80 },
      }),
    ).resolves.toEqual({ ok: true });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        table_id: "import_batches",
        column_order: ["filename", "year"],
        visible_ids: ["filename", "year"],
        widths: { filename: 200, year: 80 },
      }),
      { onConflict: "user_id,table_id" },
    );
  });
});
