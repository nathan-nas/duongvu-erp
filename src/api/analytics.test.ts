import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, rpc } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    rpc,
  })),
}));

import { fetchSpendLinesPage } from "./analytics";

describe("fetchSpendLinesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("uses the seven-argument RPC and maps receipt fields", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: "line-1",
          payment_date: "2025-12-01",
          received_date: "2025-12-02",
          party_name: "Nhà cung cấp A",
          recipient_name: "CHINH",
          amount: "100000",
          total_count: 1,
          total_amount: "100000",
        },
      ],
      error: null,
    });

    const result = await fetchSpendLinesPage({
      from: "2025-12-01",
      to: "2025-12-31",
      filterKind: "party",
      filterValue: "NCC01 — Nhà cung cấp A",
      itemLabel: "VT01 — Vật tư A",
      offset: 0,
      limit: 400,
    });

    expect(rpc).toHaveBeenCalledWith("spend_lines_page", {
      p_from: "2025-12-01",
      p_to: "2025-12-31",
      p_filter_kind: "party",
      p_filter_value: "NCC01 — Nhà cung cấp A",
      p_limit: 400,
      p_offset: 0,
      p_item_label: "VT01 — Vật tư A",
    });
    expect(result).toEqual({
      lines: [
        expect.objectContaining({
          id: "line-1",
          received_date: "2025-12-02",
          recipient_name: "CHINH",
          amount: 100000,
        }),
      ],
      totalCount: 1,
      totalAmount: 100000,
    });
  });
});
