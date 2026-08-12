"use server";

import { createClient } from "@/lib/supabase/server";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";
import type { SpendAggregate } from "@/lib/spend/aggregations";

export type SpendFilterKind =
  | "all"
  | "plant_name"
  | "expense_code"
  | "month"
  | "party";

export type AnalyticsLine = {
  id: string;
  payment_date: string | null;
  received_date: string | null;
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
  recipient_name: string | null;
};

export type SpendDateBounds = {
  min: string | null;
  max: string | null;
};

export type SpendRangeTotals = {
  amountSum: number;
  factRows: number;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isoDateOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" && value !== "") return value.slice(0, 10);
  return null;
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

function mapLineRows(rows: Record<string, unknown>[]): AnalyticsLine[] {
  return rows.map((line) => ({
    id: String(line.id),
    payment_date: stringOrNull(line.payment_date)?.slice(0, 10) ?? null,
    received_date: stringOrNull(line.received_date)?.slice(0, 10) ?? null,
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
    recipient_name: stringOrNull(line.recipient_name),
  }));
}

export async function fetchSpendDateBounds(): Promise<SpendDateBounds> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { min: null, max: null };

  const { data } = await supabase.rpc("spend_date_bounds");
  const row = Array.isArray(data) ? data[0] : data;
  return {
    min: isoDateOrNull(row?.min_payment_date),
    max: isoDateOrNull(row?.max_payment_date),
  };
}

export async function fetchSpendAggregates(input: {
  from: string;
  to: string;
}): Promise<{
  plant: SpendAggregate[];
  expense: SpendAggregate[];
  party: SpendAggregate[];
  month: SpendAggregate[];
  plantAll: SpendAggregate[];
  expenseAll: SpendAggregate[];
  partyAll: SpendAggregate[];
  totals: SpendRangeTotals;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = { p_from: input.from, p_to: input.to };

  const results = await Promise.all([
    supabase.rpc("spend_agg_by_plant", { ...params, p_top: 15 }),
    supabase.rpc("spend_agg_by_expense", { ...params, p_top: 15 }),
    supabase.rpc("spend_agg_by_party", { ...params, p_top: 15 }),
    supabase.rpc("spend_agg_by_month", params),
    supabase.rpc("spend_agg_by_plant", { ...params, p_top: null }),
    supabase.rpc("spend_agg_by_expense", { ...params, p_top: null }),
    supabase.rpc("spend_agg_by_party", { ...params, p_top: null }),
    supabase.rpc("spend_range_totals", params),
  ]);

  if (results.some((result) => result.error)) {
    if (process.env.NODE_ENV === "development") {
      for (const result of results) {
        if (result.error) console.error("fetchSpendAggregates", result.error);
      }
    }
    return null;
  }

  const [
    plantTop,
    expenseTop,
    partyTop,
    month,
    plantAll,
    expenseAll,
    partyAll,
    totals,
  ] = results;

  const totalsRow = Array.isArray(totals.data) ? totals.data[0] : totals.data;

  return {
    plant: mapAggregateRows(plantTop.data),
    expense: mapAggregateRows(expenseTop.data),
    party: mapAggregateRows(partyTop.data),
    month: mapAggregateRows(month.data),
    plantAll: mapAggregateRows(plantAll.data),
    expenseAll: mapAggregateRows(expenseAll.data),
    partyAll: mapAggregateRows(partyAll.data),
    totals: {
      amountSum: Number(totalsRow?.amount_sum) || 0,
      factRows: Number(totalsRow?.fact_rows) || 0,
    },
  };
}

/** Loads one page of matching spend lines. */
export async function fetchSpendLinesPage(input: {
  from: string;
  to: string;
  filterKind: SpendFilterKind;
  filterValue: string;
  itemLabel?: string | null;
  offset?: number;
  limit?: number;
}): Promise<
  { lines: AnalyticsLine[]; totalCount: number; totalAmount: number } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bạn cần đăng nhập." };
  }

  const limit = input.limit ?? SPEND_LINE_CHUNK;
  const offset = input.offset ?? 0;

  const { data, error } = await supabase.rpc("spend_lines_page", {
    p_from: input.from,
    p_to: input.to,
    p_filter_kind: input.filterKind,
    p_filter_value: input.filterValue,
    p_limit: limit,
    p_offset: offset,
    p_item_label: input.itemLabel ?? null,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("spend_lines_page", error);
    }
    return { error: "Không tải được dữ liệu." };
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) || 0 : 0;
  const totalAmount = rows.length > 0 ? Number(rows[0].total_amount) || 0 : 0;

  return { lines: mapLineRows(rows), totalCount, totalAmount };
}

/** Item aggregates for one đối tác within a date range. */
export async function fetchPartyItemAggregates(input: {
  from: string;
  to: string;
  partyLabel: string;
}): Promise<SpendAggregate[] | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bạn cần đăng nhập." };
  }

  const { data, error } = await supabase.rpc("spend_agg_items_for_party", {
    p_from: input.from,
    p_to: input.to,
    p_party_label: input.partyLabel,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("spend_agg_items_for_party", error);
    }
    return { error: "Không tải được dữ liệu." };
  }

  return mapAggregateRows(data);
}

/**
 * Loads matching spend lines in chunks.
 * Caps auto-load so full-year dumps (~80k) do not time out the server action.
 */
export async function fetchSpendLines(input: {
  from: string;
  to: string;
  filterKind: SpendFilterKind;
  filterValue: string;
  itemLabel?: string | null;
  maxRows?: number;
}): Promise<
  | {
      lines: AnalyticsLine[];
      totalCount: number;
      totalAmount: number;
      truncated: boolean;
    }
  | { error: string }
> {
  const maxRows = input.maxRows ?? SPEND_LINE_CHUNK * 5;
  const lines: AnalyticsLine[] = [];
  let totalCount = 0;
  let totalAmount = 0;
  let offset = 0;

  for (;;) {
    const page = await fetchSpendLinesPage({
      ...input,
      offset,
      limit: SPEND_LINE_CHUNK,
    });
    if ("error" in page) {
      return page;
    }

    if (page.lines.length === 0) {
      totalCount = page.totalCount;
      totalAmount = page.totalAmount;
      break;
    }

    totalCount = page.totalCount;
    totalAmount = page.totalAmount;
    lines.push(...page.lines);

    if (lines.length >= totalCount || page.lines.length < SPEND_LINE_CHUNK) {
      break;
    }
    if (lines.length >= maxRows) {
      break;
    }
    offset += SPEND_LINE_CHUNK;
  }

  return {
    lines,
    totalCount,
    totalAmount,
    truncated: lines.length < totalCount,
  };
}
