import { parsePaymentDate } from "./normalize-date";
import type { SpendLineDraft } from "./types";

function cellStr(value: unknown): string | null {
  if (value == null || value === "") return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function upperCode(value: unknown): string | null {
  const text = cellStr(value);
  return text ? text.toUpperCase() : null;
}

function cellNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

const IDENTITY_AND_MEASURE_INDICES = [0, 1, 2, 4, 5, 6, 7, 8, 11, 12];

function isBlankRow(cells: unknown[]): boolean {
  return IDENTITY_AND_MEASURE_INDICES.every((index) => {
    const value = cells[index];
    return value == null || value === "";
  });
}

export function mapFactRow(
  cells: unknown[],
  periodYear: number,
): SpendLineDraft | null {
  if (isBlankRow(cells)) return null;

  const dateResult = parsePaymentDate(cells[0], periodYear);
  const receivedDateResult = parsePaymentDate(cells[14], periodYear);
  const qty = cellNum(cells[6]);
  const unitPrice = cellNum(cells[7]);
  const amount = cellNum(cells[8]);

  const qualityFlags = [...dateResult.flags];
  if (cells[14] != null && cells[14] !== "") {
    qualityFlags.push(
      ...receivedDateResult.flags.map((flag) => `received_${flag}`),
    );
  }
  if (
    qty != null &&
    unitPrice != null &&
    amount != null &&
    Math.abs(qty * unitPrice - amount) > 1
  ) {
    qualityFlags.push("amount_mismatch");
  }

  return {
    payment_date: dateResult.date,
    payment_date_raw: dateResult.raw,
    received_date: receivedDateResult.date,
    received_date_raw: receivedDateResult.raw,
    party_code: upperCode(cells[1]),
    party_name: cellStr(cells[2]),
    uom: cellStr(cells[3]),
    item_code: upperCode(cells[4]),
    item_name: cellStr(cells[5]),
    qty,
    unit_price: unitPrice,
    amount,
    plant_name: cellStr(cells[11]),
    expense_code: upperCode(cells[12]),
    payment_method: cellStr(cells[15]),
    description: cellStr(cells[9]),
    invoice: cellStr(cells[16]),
    note: cellStr(cells[17]),
    recipient_name: cellStr(cells[13]),
    quality_flags: qualityFlags,
  };
}
