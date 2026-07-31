"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";
import { isIsoDate } from "@/lib/spend/date-range";
import { SPEND_UPLOADS_BUCKET } from "@/lib/spend/storage-paths";
import type { BatchKind } from "@/lib/spend/types";

const LOGIN_REQUIRED = "Bạn cần đăng nhập.";
const DELETE_FAILED = "Không xóa được dữ liệu.";
const LIST_FAILED = "Không tải được danh sách lô.";
const INVALID_DATE = "Ngày không hợp lệ.";

const MAX_DELETE_ITERATIONS = 500;

export type ImportBatchRow = {
  id: string;
  source_filename: string;
  period_year: number;
  batch_kind: BatchKind;
  fact_rows: number;
  amount_sum: number;
  status: string;
  created_at: string;
  storage_path: string | null;
};

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

function invalidateDataPages() {
  revalidatePath("/app/data");
  revalidatePath("/app/analytics");
}

async function bestEffortRemoveStorage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;

  try {
    await supabase.storage.from(SPEND_UPLOADS_BUCKET).remove(unique);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Storage cleanup failed:", err);
    }
  }
}

export async function listImportBatches(): Promise<
  { batches: ImportBatchRow[] } | { error: string }
> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  const { data, error } = await supabase
    .from("import_batch")
    .select(
      "id, source_filename, period_year, batch_kind, fact_rows, amount_sum, status, created_at, storage_path",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: LIST_FAILED };
  }

  const batches: ImportBatchRow[] = (data ?? []).map((row) => ({
    id: row.id,
    source_filename: row.source_filename,
    period_year: Number(row.period_year),
    batch_kind: row.batch_kind as BatchKind,
    fact_rows: Number(row.fact_rows),
    amount_sum: Number(row.amount_sum),
    status: row.status,
    created_at: row.created_at,
    storage_path: row.storage_path,
  }));

  return { batches };
}

export async function previewDeleteByDateRange(input: {
  from: string;
  to: string;
}): Promise<
  | { rowCount: number; amountSum: number; batchCountTouched: number }
  | { error: string }
> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  if (!isIsoDate(input.from) || !isIsoDate(input.to)) {
    return { error: INVALID_DATE };
  }

  const { data, error } = await supabase.rpc("spend_delete_preview", {
    p_from: input.from,
    p_to: input.to,
  });

  if (error) {
    return { error: DELETE_FAILED };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    rowCount: Number(row?.row_count ?? 0),
    amountSum: Number(row?.amount_sum ?? 0),
    batchCountTouched: Number(row?.batch_count_touched ?? 0),
  };
}

export async function deleteImportBatch(
  batchId: string,
): Promise<{ ok: true } | { error: string }> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  if (!batchId || typeof batchId !== "string") {
    return { error: DELETE_FAILED };
  }

  const { data: batch, error: readError } = await supabase
    .from("import_batch")
    .select("id, storage_path, parsed_path")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !batch) {
    return { error: DELETE_FAILED };
  }

  const storagePaths = [batch.storage_path, batch.parsed_path].filter(
    (p): p is string => Boolean(p),
  );

  const { error: deleteError } = await supabase
    .from("import_batch")
    .delete()
    .eq("id", batchId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: DELETE_FAILED };
  }

  await bestEffortRemoveStorage(supabase, storagePaths);
  invalidateDataPages();

  return { ok: true };
}

export async function deleteSpendLinesByDateRange(input: {
  from: string;
  to: string;
}): Promise<
  | { ok: true; deletedRows: number; prunedBatches: number }
  | { error: string; deletedTotal?: number }
> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  if (!isIsoDate(input.from) || !isIsoDate(input.to)) {
    return { error: INVALID_DATE };
  }

  if (input.from > input.to) {
    return { error: INVALID_DATE };
  }

  let deletedTotal = 0;

  for (let i = 0; i < MAX_DELETE_ITERATIONS; i++) {
    const { data, error } = await supabase.rpc("spend_delete_by_date_range", {
      p_from: input.from,
      p_to: input.to,
      p_limit: SPEND_LINE_CHUNK,
    });

    if (error) {
      return { error: DELETE_FAILED, deletedTotal };
    }

    const deleted = Number(data ?? 0);
    deletedTotal += deleted;

    if (deleted < SPEND_LINE_CHUNK) {
      break;
    }

    if (i === MAX_DELETE_ITERATIONS - 1) {
      return { error: DELETE_FAILED, deletedTotal };
    }
  }

  const { data: pruned, error: pruneError } = await supabase.rpc(
    "spend_prune_empty_batches",
  );

  if (pruneError) {
    return { error: DELETE_FAILED, deletedTotal };
  }

  const prunedRows = Array.isArray(pruned) ? pruned : pruned ? [pruned] : [];
  const storagePaths = prunedRows.flatMap((row) =>
    [row.storage_path, row.parsed_path].filter((p): p is string => Boolean(p)),
  );

  await bestEffortRemoveStorage(supabase, storagePaths);
  invalidateDataPages();

  return {
    ok: true,
    deletedRows: deletedTotal,
    prunedBatches: prunedRows.length,
  };
}
