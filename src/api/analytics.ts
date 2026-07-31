"use server";

import { createClient } from "@/lib/supabase/server";
import { SPEND_LINES_PAGE_SIZE } from "@/lib/spend/constants";
import type { SpendAggregate } from "@/lib/spend/aggregations";

export type SpendFilterKind = "all" | "plant_name" | "expense_code" | "month";

export type AnalyticsLine = {
  id: string;
  payment_date: string | null;
  party_code: string | null;
  party_name: string | null;
  item_code: string | null;
  item_name: string | null;
  uom: string | null;
  qty: number | null;
  unit_price: number | null;
  amount: number | null;
  plant_name: string | null;
  expense_code: string | null;
  payment_method: string | null;
  description: string | null;
  invoice: string | null;
  note: string | null;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapAggregateRows(
  rows: { label: string; amount: number | string; count: number | string }[] | null,
): SpendAggregate[] {
  return (rows ?? []).map((row) => ({
    label: String(row.label),
    amount: Number(row.amount) || 0,
    count: Number(row.count) || 0,
  }));
}

export async function fetchSpendAggregates(batchId: string): Promise<{
  plant: SpendAggregate[];
  expense: SpendAggregate[];
  month: SpendAggregate[];
  plantAll: SpendAggregate[];
  expenseAll: SpendAggregate[];
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: batch } = await supabase
    .from("import_batch")
    .select("id")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .eq("status", "ready")
    .maybeSingle();

  if (!batch) return null;

  const [plantTop, expenseTop, month, plantAll, expenseAll] = await Promise.all([
    supabase.rpc("spend_agg_by_plant", { p_batch_id: batchId, p_top: 15 }),
    supabase.rpc("spend_agg_by_expense", { p_batch_id: batchId, p_top: 15 }),
    supabase.rpc("spend_agg_by_month", { p_batch_id: batchId }),
    supabase.rpc("spend_agg_by_plant", { p_batch_id: batchId, p_top: null }),
    supabase.rpc("spend_agg_by_expense", { p_batch_id: batchId, p_top: null }),
  ]);

  return {
    plant: mapAggregateRows(plantTop.data),
    expense: mapAggregateRows(expenseTop.data),
    month: mapAggregateRows(month.data),
    plantAll: mapAggregateRows(plantAll.data),
    expenseAll: mapAggregateRows(expenseAll.data),
  };
}

export async function fetchSpendLinesPage(input: {
  batchId: string;
  filterKind: SpendFilterKind;
  filterValue: string;
  offset?: number;
  limit?: number;
}): Promise<{ lines: AnalyticsLine[]; totalCount: number; totalAmount: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bạn cần đăng nhập." };
  }

  const limit = input.limit ?? SPEND_LINES_PAGE_SIZE;
  const offset = input.offset ?? 0;

  const { data, error } = await supabase.rpc("spend_lines_page", {
    p_batch_id: input.batchId,
    p_filter_kind: input.filterKind,
    p_filter_value: input.filterValue,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return { error: "Không tải được dữ liệu." };
  }

  const rows = data ?? [];
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) || 0 : 0;
  const totalAmount = rows.length > 0 ? Number(rows[0].total_amount) || 0 : 0;

  const lines: AnalyticsLine[] = rows.map((line: Record<string, unknown>) => ({
    id: String(line.id),
    payment_date: stringOrNull(line.payment_date),
    party_code: stringOrNull(line.party_code),
    party_name: stringOrNull(line.party_name),
    item_code: stringOrNull(line.item_code),
    item_name: stringOrNull(line.item_name),
    uom: stringOrNull(line.uom),
    qty: numberOrNull(line.qty),
    unit_price: numberOrNull(line.unit_price),
    amount: numberOrNull(line.amount),
    plant_name: stringOrNull(line.plant_name),
    expense_code: stringOrNull(line.expense_code),
    payment_method: stringOrNull(line.payment_method),
    description: stringOrNull(line.description),
    invoice: stringOrNull(line.invoice),
    note: stringOrNull(line.note),
  }));

  return { lines, totalCount, totalAmount };
}
