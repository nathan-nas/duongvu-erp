"use server";

import { createClient } from "@/lib/supabase/server";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";
import {
  computeAmountSum,
  serializeParsedLines,
} from "@/lib/spend/import-pipeline";
import { parseSpendWorkbook } from "@/lib/spend/parse-workbook";
import {
  SPEND_UPLOADS_BUCKET,
  spendParsedStoragePath,
  spendWorkbookStoragePath,
} from "@/lib/spend/storage-paths";
import type { BatchKind, ParsedWorkbookPreview, SpendSheetSummary } from "@/lib/spend/types";

const LOGIN_REQUIRED = "B\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp.";
const SAVE_FAILED = "Kh\u00f4ng l\u01b0u \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u.";
const PARSE_FAILED = "Kh\u00f4ng th\u1ec3 \u0111\u1ecdc file Excel.";
const NO_FACT_ROWS =
  "Kh\u00f4ng t\u00ecm th\u1ea5y d\u00f2ng d\u1eef li\u1ec7u h\u1ee3p l\u1ec7 trong hai sheet v\u1eadt t\u01b0.";
const UPLOAD_MISSING = "Ch\u01b0a t\u1ea3i l\u00ean file Excel.";

type PendingBatchResult =
  | { batchId: string; storagePath: string }
  | { error: string };

type PrepareResult =
  | {
      batchId: string;
      factRows: number;
      amountSum: number;
      sheetSummaries: SpendSheetSummary[];
      batchKind: BatchKind;
      suggestedPeriodYear: number | null;
      sourceFilename: string;
      periodYear: number;
    }
  | { error: string };

function workbookValidationError(
  preview: Pick<
    ParsedWorkbookPreview,
    | "hasFactSheet"
    | "missingSheetNames"
    | "unreadableSheetNames"
    | "factRows"
  >,
) {
  if (preview.missingSheetNames.length > 0) {
    return `Thi\u1ebfu sheet b\u1eaft bu\u1ed9c: ${preview.missingSheetNames.join(", ")}.`;
  }
  if (preview.unreadableSheetNames.length > 0) {
    return `Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c ti\u00eau \u0111\u1ec1 sheet: ${preview.unreadableSheetNames.join(", ")}.`;
  }
  if (!preview.hasFactSheet || preview.factRows === 0) {
    return NO_FACT_ROWS;
  }
  return null;
}

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

export async function createPendingBatch(input: {
  source_filename: string;
  period_year: number;
}): Promise<PendingBatchResult> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  const periodYear = Number.isFinite(input.period_year)
    ? Math.trunc(input.period_year)
    : new Date().getFullYear();

  const { data: batch, error } = await supabase
    .from("import_batch")
    .insert({
      user_id: user.id,
      source_filename: input.source_filename,
      period_year: periodYear,
      batch_kind: "unknown",
      fact_rows: 0,
      amount_sum: 0,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !batch) {
    return { error: SAVE_FAILED };
  }

  const storagePath = spendWorkbookStoragePath(
    user.id,
    batch.id,
    input.source_filename,
  );

  const { error: pathError } = await supabase
    .from("import_batch")
    .update({ storage_path: storagePath })
    .eq("id", batch.id)
    .eq("user_id", user.id);

  if (pathError) {
    return { error: SAVE_FAILED };
  }

  return { batchId: batch.id, storagePath };
}

export async function prepareImport(batchId: string): Promise<PrepareResult> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batch")
    .select("id, source_filename, period_year, storage_path, status")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (batchError || !batch || !batch.storage_path) {
    return { error: UPLOAD_MISSING };
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(SPEND_UPLOADS_BUCKET)
    .download(batch.storage_path);

  if (downloadError || !fileBlob) {
    return { error: UPLOAD_MISSING };
  }

  let preview;
  try {
    const buffer = await fileBlob.arrayBuffer();
    preview = parseSpendWorkbook(
      buffer,
      batch.source_filename,
      batch.period_year,
    );
  } catch {
    return { error: PARSE_FAILED };
  }

  const validationError = workbookValidationError(preview);
  if (validationError) {
    return { error: validationError };
  }

  const parsedPath = spendParsedStoragePath(user.id, batchId);
  const { error: uploadParsedError } = await supabase.storage
    .from(SPEND_UPLOADS_BUCKET)
    .upload(parsedPath, serializeParsedLines(preview.lines), {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadParsedError) {
    return { error: SAVE_FAILED };
  }

  const { error: updateError } = await supabase
    .from("import_batch")
    .update({
      parsed_path: parsedPath,
      batch_kind: preview.batchKind,
      fact_rows: preview.factRows,
      amount_sum: preview.amountSum,
    })
    .eq("id", batchId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: SAVE_FAILED };
  }

  return {
    batchId,
    factRows: preview.factRows,
    amountSum: preview.amountSum,
    sheetSummaries: preview.sheetSummaries,
    batchKind: preview.batchKind,
    suggestedPeriodYear: preview.suggestedPeriodYear,
    sourceFilename: batch.source_filename,
    periodYear: batch.period_year,
  };
}

export async function commitImport(
  batchId: string,
  periodYear: number,
): Promise<{ batchId: string } | { error: string }> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batch")
    .select("id, source_filename, storage_path, parsed_path, status")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (batchError || !batch || !batch.storage_path) {
    return { error: UPLOAD_MISSING };
  }

  const { error: processingError } = await supabase
    .from("import_batch")
    .update({ status: "processing", period_year: periodYear })
    .eq("id", batchId)
    .eq("user_id", user.id);

  if (processingError) {
    return { error: SAVE_FAILED };
  }

  await supabase.from("spend_line").delete().eq("batch_id", batchId);

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(SPEND_UPLOADS_BUCKET)
    .download(batch.storage_path);

  if (downloadError || !fileBlob) {
    await supabase
      .from("import_batch")
      .update({ status: "failed" })
      .eq("id", batchId)
      .eq("user_id", user.id);
    return { error: UPLOAD_MISSING };
  }

  let preview;
  try {
    preview = parseSpendWorkbook(
      await fileBlob.arrayBuffer(),
      batch.source_filename,
      periodYear,
    );
  } catch {
    await supabase
      .from("import_batch")
      .update({ status: "failed" })
      .eq("id", batchId)
      .eq("user_id", user.id);
    return { error: PARSE_FAILED };
  }

  const validationError = workbookValidationError(preview);
  if (validationError) {
    await supabase
      .from("import_batch")
      .update({ status: "failed" })
      .eq("id", batchId)
      .eq("user_id", user.id);
    return { error: validationError };
  }

  const parsedPath =
    batch.parsed_path ?? spendParsedStoragePath(user.id, batchId);
  await supabase.storage
    .from(SPEND_UPLOADS_BUCKET)
    .upload(parsedPath, serializeParsedLines(preview.lines), {
      contentType: "application/json",
      upsert: true,
    });

  for (
    let start = 0;
    start < preview.lines.length;
    start += SPEND_LINE_CHUNK
  ) {
    const chunk = preview.lines.slice(start, start + SPEND_LINE_CHUNK);
    const { error } = await supabase.from("spend_line").insert(
      chunk.map((line) => ({
        ...line,
        batch_id: batchId,
        user_id: user.id,
      })),
    );

    if (error) {
      await supabase.from("spend_line").delete().eq("batch_id", batchId);
      await supabase
        .from("import_batch")
        .update({ status: "failed" })
        .eq("id", batchId)
        .eq("user_id", user.id);
      return { error: SAVE_FAILED };
    }
  }

  const amountSum = computeAmountSum(preview.lines);
  const { error: readyError } = await supabase
    .from("import_batch")
    .update({
      status: "ready",
      period_year: periodYear,
      batch_kind: preview.batchKind,
      fact_rows: preview.lines.length,
      amount_sum: amountSum,
      parsed_path: parsedPath,
    })
    .eq("id", batchId)
    .eq("user_id", user.id);

  if (readyError) {
    return { error: SAVE_FAILED };
  }

  return { batchId };
}

export async function markImportBatchFailed(
  batchId: string,
): Promise<{ error: string | null }> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) {
    return { error: authError ?? LOGIN_REQUIRED };
  }

  await supabase.from("spend_line").delete().eq("batch_id", batchId);

  const { error } = await supabase
    .from("import_batch")
    .update({ status: "failed" })
    .eq("id", batchId)
    .eq("user_id", user.id);

  return { error: error ? SAVE_FAILED : null };
}
