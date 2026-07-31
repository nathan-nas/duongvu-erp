import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, from, rpc, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
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
  })),
}));

import {
  createSpendLine,
  deleteSpendLine,
  updateSpendLine,
} from "./spend-lines";

describe("spend-lines CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated create", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(
      createSpendLine({
        payment_date: "2026-01-01",
        party_code: null,
        party_name: null,
        item_code: null,
        item_name: null,
        uom: null,
        qty: null,
        unit_price: null,
        amount: 100,
        plant_name: null,
        expense_code: null,
        payment_method: null,
        description: null,
        invoice: null,
        note: null,
      }),
    ).resolves.toEqual({ error: "Bạn cần đăng nhập." });
  });

  it("creates into Nhập tay batch and recalcs", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const limit = vi.fn(() => ({ maybeSingle }));
    const order = vi.fn(() => ({ limit }));
    const inStatus = vi.fn(() => ({ order }));
    const eqFilename = vi.fn(() => ({ in: inStatus }));
    const eqUser = vi.fn(() => ({ eq: eqFilename }));
    const selectFind = vi.fn(() => ({ eq: eqUser }));

    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: "manual-1" },
      error: null,
    });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insertBatch = vi.fn(() => ({ select: insertSelect }));

    const lineSingle = vi.fn().mockResolvedValue({
      data: {
        id: "line-1",
        payment_date: "2026-01-01",
        party_code: null,
        party_name: "Shop",
        item_code: null,
        item_name: null,
        uom: null,
        qty: null,
        unit_price: null,
        amount: 100,
        plant_name: null,
        expense_code: null,
        payment_method: null,
        description: null,
        invoice: null,
        note: null,
      },
      error: null,
    });
    const lineSelect = vi.fn(() => ({ single: lineSingle }));
    const insertLine = vi.fn(() => ({ select: lineSelect }));

    from.mockImplementation((table: string) => {
      if (table === "import_batch") {
        return { select: selectFind, insert: insertBatch };
      }
      return { insert: insertLine };
    });
    rpc.mockResolvedValue({ data: null, error: null });

    const result = await createSpendLine({
      payment_date: "2026-01-01",
      party_code: null,
      party_name: "Shop",
      item_code: null,
      item_name: null,
      uom: null,
      qty: null,
      unit_price: null,
      amount: 100,
      plant_name: null,
      expense_code: null,
      payment_method: null,
      description: null,
      invoice: null,
      note: null,
    });

    expect(result).toMatchObject({
      line: { id: "line-1", party_name: "Shop", amount: 100 },
    });
    expect(rpc).toHaveBeenCalledWith("spend_recalc_batch_stats", {
      p_batch_id: "manual-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/app/analytics");
  });

  it("updates and recalcs existing line", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "line-1", batch_id: "batch-1" },
      error: null,
    });
    const eqUserFind = vi.fn(() => ({ maybeSingle }));
    const eqIdFind = vi.fn(() => ({ eq: eqUserFind }));
    const selectFind = vi.fn(() => ({ eq: eqIdFind }));

    const updateSingle = vi.fn().mockResolvedValue({
      data: {
        id: "line-1",
        payment_date: "2026-01-02",
        party_code: null,
        party_name: "Shop 2",
        item_code: null,
        item_name: null,
        uom: null,
        qty: null,
        unit_price: null,
        amount: 200,
        plant_name: null,
        expense_code: null,
        payment_method: null,
        description: null,
        invoice: null,
        note: null,
      },
      error: null,
    });
    const updateSelect = vi.fn(() => ({ single: updateSingle }));
    const eqUserUpdate = vi.fn(() => ({ select: updateSelect }));
    const eqIdUpdate = vi.fn(() => ({ eq: eqUserUpdate }));
    const update = vi.fn(() => ({ eq: eqIdUpdate }));

    from.mockReturnValue({ select: selectFind, update });
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      updateSpendLine("line-1", {
        payment_date: "2026-01-02",
        party_code: null,
        party_name: "Shop 2",
        item_code: null,
        item_name: null,
        uom: null,
        qty: null,
        unit_price: null,
        amount: 200,
        plant_name: null,
        expense_code: null,
        payment_method: null,
        description: null,
        invoice: null,
        note: null,
      }),
    ).resolves.toMatchObject({
      line: { id: "line-1", amount: 200 },
    });

    expect(rpc).toHaveBeenCalledWith("spend_recalc_batch_stats", {
      p_batch_id: "batch-1",
    });
  });

  it("deletes line, recalcs, and prunes empty batches", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "line-1", batch_id: "batch-1" },
      error: null,
    });
    const eqUserFind = vi.fn(() => ({ maybeSingle }));
    const eqIdFind = vi.fn(() => ({ eq: eqUserFind }));
    const selectFind = vi.fn(() => ({ eq: eqIdFind }));

    const eqUserDel = vi.fn().mockResolvedValue({ error: null });
    const eqIdDel = vi.fn(() => ({ eq: eqUserDel }));
    const del = vi.fn(() => ({ eq: eqIdDel }));

    from.mockReturnValue({ select: selectFind, delete: del });
    rpc.mockResolvedValue({ data: [], error: null });

    await expect(deleteSpendLine("line-1")).resolves.toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("spend_recalc_batch_stats", {
      p_batch_id: "batch-1",
    });
    expect(rpc).toHaveBeenCalledWith("spend_prune_empty_batches");
  });
});
