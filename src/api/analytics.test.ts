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

import { fetchSpendAggregates, fetchSpendLinesPage } from "./analytics";

describe("fetchSpendAggregates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("loads full party aggregates for KPI counts", async () => {
    rpc.mockImplementation((name: string, args: { p_top?: number | null }) => {
      if (name === "spend_agg_by_party" && args.p_top == null) {
        return {
          data: [
            { label: "NCC01 — Nhà cung cấp A", amount: 100, count: 2 },
            { label: "NCC02 — Nhà cung cấp B", amount: 50, count: 1 },
          ],
          error: null,
        };
      }
      if (name === "spend_range_totals") {
        return {
          data: [{ amount_sum: 150, fact_rows: 3 }],
          error: null,
        };
      }
      return { data: [], error: null };
    });

    const result = await fetchSpendAggregates({
      from: "2025-12-01",
      to: "2025-12-31",
    });

    expect(rpc).toHaveBeenCalledWith("spend_agg_by_party", {
      p_from: "2025-12-01",
      p_to: "2025-12-31",
      p_top: null,
    });
    expect(result?.partyAll).toEqual([
      { label: "NCC01 — Nhà cung cấp A", amount: 100, count: 2 },
      { label: "NCC02 — Nhà cung cấp B", amount: 50, count: 1 },
    ]);
  });

  it("returns null when an aggregate RPC fails", async () => {
    rpc.mockImplementation((name: string) => {
      if (name === "spend_agg_by_plant") {
        return { data: null, error: { message: "db error" } };
      }
      return { data: [], error: null };
    });

    const result = await fetchSpendAggregates({
      from: "2025-12-01",
      to: "2025-12-31",
    });

    expect(result).toBeNull();
  });
});

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
