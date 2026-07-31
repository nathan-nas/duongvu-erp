import type { BatchKind } from "./types";

export type BatchLabelInput = {
  source_filename: string;
  period_year: number;
  batch_kind: BatchKind;
};

/** Extract period month (1–12) from filenames like `VAT TU T12-2025 (HOAI).xlsx`. */
export function extractPeriodMonthFromFilename(filename: string): number | null {
  const match = filename.match(/T(\d{1,2})-20\d{2}/i);
  if (!match) return null;
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? month : null;
}

/** Human label for the batch selector — period as month/year, annual as year summary. */
export function formatImportBatchLabel(batch: BatchLabelInput): string {
  if (batch.batch_kind === "annual") {
    return `Tổng hợp năm ${batch.period_year}`;
  }

  if (batch.batch_kind === "period") {
    const month = extractPeriodMonthFromFilename(batch.source_filename);
    if (month != null) {
      return `Tháng ${month}/${batch.period_year}`;
    }
    return `Theo kỳ ${batch.period_year}`;
  }

  return `Năm ${batch.period_year}`;
}
