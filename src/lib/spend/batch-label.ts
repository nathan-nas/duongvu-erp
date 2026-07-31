import { formatViDate } from "./format";
import type { BatchKind } from "./types";

export type BatchLabelInput = {
  batch_kind: BatchKind;
  period_year: number;
  /** ISO `YYYY-MM-DD` from spend_line.payment_date */
  payment_date_min: string | null;
  payment_date_max: string | null;
};

function yearFromIso(iso: string | null): number | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

/**
 * Batch selector label from ngày (payment_date), not the Excel filename.
 * - annual → year summary
 * - otherwise → DD/MM/YYYY or DD/MM/YYYY – DD/MM/YYYY
 */
export function formatImportBatchLabel(batch: BatchLabelInput): string {
  const min = batch.payment_date_min;
  const max = batch.payment_date_max;

  if (batch.batch_kind === "annual") {
    const year =
      yearFromIso(max) ?? yearFromIso(min) ?? batch.period_year;
    return `Tổng hợp năm ${year}`;
  }

  if (min && max) {
    const start = formatViDate(min);
    const end = formatViDate(max);
    if (start === "—" && end === "—") {
      return `Năm ${batch.period_year}`;
    }
    if (start === end || !max || min === max) {
      return start;
    }
    return `${start} – ${end}`;
  }

  if (min) return formatViDate(min);
  if (max) return formatViDate(max);
  return `Năm ${batch.period_year}`;
}
