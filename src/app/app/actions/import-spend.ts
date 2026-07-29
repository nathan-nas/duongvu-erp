"use server";

import { createClient } from "@/lib/supabase/server";
import type { BatchKind, SpendLineDraft } from "@/lib/hoai/types";

export const SPEND_LINE_CHUNK = 400;

const LOGIN_REQUIRED = "Bạn cần đăng nhập.";
const SAVE_FAILED = "Không lưu được dữ liệu.";

export async function createImportBatch(input: {
  source_filename: string;
  period_year: number;
  batch_kind: BatchKind;
  fact_rows: number;
  amount_sum: number;
}): Promise<{ batchId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: LOGIN_REQUIRED };
  }

  const { data: batch, error } = await supabase
    .from("import_batch")
    .insert({ ...input, user_id: user.id })
    .select("id")
    .single();

  if (error || !batch) {
    return { error: SAVE_FAILED };
  }

  return { batchId: batch.id };
}

export async function insertSpendLinesChunk(
  batchId: string,
  lines: SpendLineDraft[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: LOGIN_REQUIRED };
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batch")
    .select("id")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (batchError || !batch) {
    return { error: SAVE_FAILED };
  }

  for (let start = 0; start < lines.length; start += SPEND_LINE_CHUNK) {
    const { error } = await supabase.from("spend_line").insert(
      lines.slice(start, start + SPEND_LINE_CHUNK).map((line) => ({
        ...line,
        batch_id: batchId,
        user_id: user.id,
      })),
    );

    if (error) {
      return { error: SAVE_FAILED };
    }
  }

  return { error: null };
}

export async function markImportBatchFailed(
  batchId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: LOGIN_REQUIRED };
  }

  const { error } = await supabase
    .from("import_batch")
    .update({ status: "failed" })
    .eq("id", batchId)
    .eq("user_id", user.id);

  return { error: error ? SAVE_FAILED : null };
}
