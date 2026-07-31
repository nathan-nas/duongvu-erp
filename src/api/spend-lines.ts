"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isIsoDate } from "@/lib/spend/date-range";
import {
  MANUAL_BATCH_FILENAME,
  resolveAmount,
  type SpendLineFields,
} from "@/lib/spend/line-fields";
import type { AnalyticsLine } from "@/api/analytics";

const LOGIN_REQUIRED = "Bạn cần đăng nhập.";
const SAVE_FAILED = "Không lưu được dữ liệu.";
const DELETE_FAILED = "Không xóa được dữ liệu.";
const INVALID_DATE = "Ngày không hợp lệ.";
const NOT_FOUND = "Không tìm thấy dòng chi.";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null as null, error: LOGIN_REQUIRED };
  }

  return { supabase, user, error: null as null };
}

function invalidate() {
  revalidatePath("/app/data");
  revalidatePath("/app/analytics");
}

function normalizeFields(input: SpendLineFields): SpendLineFields | { error: string } {
  const paymentDate =
    input.payment_date && input.payment_date.trim() !== ""
      ? input.payment_date.trim().slice(0, 10)
      : null;

  if (paymentDate && !isIsoDate(paymentDate)) {
    return { error: INVALID_DATE };
  }

  const amount = resolveAmount(input);

  return {
    payment_date: paymentDate,
    party_code: emptyToNull(input.party_code),
    party_name: emptyToNull(input.party_name),
    item_code: emptyToNull(input.item_code),
    item_name: emptyToNull(input.item_name),
    uom: emptyToNull(input.uom),
    qty: numberOrNull(input.qty),
    unit_price: numberOrNull(input.unit_price),
    amount: numberOrNull(amount),
    plant_name: emptyToNull(input.plant_name),
    expense_code: emptyToNull(input.expense_code),
    payment_method: emptyToNull(input.payment_method),
    description: emptyToNull(input.description),
    invoice: emptyToNull(input.invoice),
    note: emptyToNull(input.note),
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function numberOrNull(value: number | null | undefined): number | null {
  if (value == null || value === ("" as unknown)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapLine(row: Record<string, unknown>): AnalyticsLine {
  return {
    id: String(row.id),
    payment_date:
      typeof row.payment_date === "string"
        ? row.payment_date.slice(0, 10)
        : null,
    party_code: emptyToNull(row.party_code as string | null),
    party_name: emptyToNull(row.party_name as string | null),
    item_code: emptyToNull(row.item_code as string | null),
    item_name: emptyToNull(row.item_name as string | null),
    uom: emptyToNull(row.uom as string | null),
    qty: numberOrNull(row.qty as number | null),
    unit_price: numberOrNull(row.unit_price as number | null),
    amount: numberOrNull(row.amount as number | null),
    plant_name: emptyToNull(row.plant_name as string | null),
    expense_code: emptyToNull(row.expense_code as string | null),
    payment_method: emptyToNull(row.payment_method as string | null),
    description: emptyToNull(row.description as string | null),
    invoice: emptyToNull(row.invoice as string | null),
    note: emptyToNull(row.note as string | null),
  };
}

async function ensureManualBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ batchId: string } | { error: string }> {
  const { data: existing, error: findError } = await supabase
    .from("import_batch")
    .select("id")
    .eq("user_id", userId)
    .eq("source_filename", MANUAL_BATCH_FILENAME)
    .in("status", ["ready", "pending"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return { error: SAVE_FAILED };
  }

  if (existing?.id) {
    return { batchId: existing.id };
  }

  const year = new Date().getFullYear();
  const { data: created, error: insertError } = await supabase
    .from("import_batch")
    .insert({
      user_id: userId,
      source_filename: MANUAL_BATCH_FILENAME,
      period_year: year,
      batch_kind: "unknown",
      fact_rows: 0,
      amount_sum: 0,
      status: "ready",
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return { error: SAVE_FAILED };
  }

  return { batchId: created.id };
}

async function recalcBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string,
) {
  await supabase.rpc("spend_recalc_batch_stats", { p_batch_id: batchId });
}

export async function createSpendLine(
  input: SpendLineFields,
): Promise<{ line: AnalyticsLine } | { error: string }> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  const fields = normalizeFields(input);
  if ("error" in fields) {
    return fields;
  }

  const manual = await ensureManualBatch(supabase, user.id);
  if ("error" in manual) {
    return manual;
  }

  const { data, error } = await supabase
    .from("spend_line")
    .insert({
      batch_id: manual.batchId,
      user_id: user.id,
      ...fields,
      quality_flags: [],
    })
    .select(
      "id, payment_date, party_code, party_name, item_code, item_name, uom, qty, unit_price, amount, plant_name, expense_code, payment_method, description, invoice, note",
    )
    .single();

  if (error || !data) {
    return { error: SAVE_FAILED };
  }

  await recalcBatch(supabase, manual.batchId);
  invalidate();
  return { line: mapLine(data as Record<string, unknown>) };
}

export async function updateSpendLine(
  id: string,
  input: SpendLineFields,
): Promise<{ line: AnalyticsLine } | { error: string }> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  if (!id) {
    return { error: NOT_FOUND };
  }

  const fields = normalizeFields(input);
  if ("error" in fields) {
    return fields;
  }

  const { data: existing, error: findError } = await supabase
    .from("spend_line")
    .select("id, batch_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError || !existing) {
    return { error: NOT_FOUND };
  }

  const { data, error } = await supabase
    .from("spend_line")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, payment_date, party_code, party_name, item_code, item_name, uom, qty, unit_price, amount, plant_name, expense_code, payment_method, description, invoice, note",
    )
    .single();

  if (error || !data) {
    return { error: SAVE_FAILED };
  }

  await recalcBatch(supabase, existing.batch_id);
  invalidate();
  return { line: mapLine(data as Record<string, unknown>) };
}

export async function deleteSpendLine(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  if (!id) {
    return { error: NOT_FOUND };
  }

  const { data: existing, error: findError } = await supabase
    .from("spend_line")
    .select("id, batch_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError || !existing) {
    return { error: NOT_FOUND };
  }

  const { error } = await supabase
    .from("spend_line")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: DELETE_FAILED };
  }

  await recalcBatch(supabase, existing.batch_id);
  await supabase.rpc("spend_prune_empty_batches");
  invalidate();
  return { ok: true };
}
