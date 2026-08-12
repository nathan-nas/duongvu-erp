import type { SpendFactField } from "./header-aliases";
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

function isEmptyValue(value: unknown): boolean {
  return value == null || value === "";
}

function hasMeaningfulIdentity(
  fields: Partial<Record<SpendFactField, unknown>>,
): boolean {
  return (
    cellStr(fields.party_name) != null ||
    cellStr(fields.party_code) != null ||
    cellStr(fields.item_name) != null
  );
}

const TOTALS_ROW_OTHER_FIELDS: SpendFactField[] = [
  "payment_date",
  "party_code",
  "party_name",
  "received_date",
  "item_code",
  "item_name",
  "uom",
  "qty",
  "unit_price",
  "description",
  "expense_code",
  "recipient_name",
  "plant_name",
  "payment_method",
  "invoice",
  "note",
];

function isTotalsRow(
  fields: Partial<Record<SpendFactField, unknown>>,
): boolean {
  if (cellNum(fields.amount) == null) return false;
  return TOTALS_ROW_OTHER_FIELDS.every((field) => isEmptyValue(fields[field]));
}

function shouldSkipRow(
  fields: Partial<Record<SpendFactField, unknown>>,
): boolean {
  if (Object.keys(fields).length === 0) return true;
  if (isTotalsRow(fields)) return true;
  if (isEmptyValue(fields.payment_date) && !hasMeaningfulIdentity(fields)) {
    return true;
  }
  return false;
}

export function mapFactRow(
  fields: Partial<Record<SpendFactField, unknown>>,
  periodYear: number,
): SpendLineDraft | null {
  if (shouldSkipRow(fields)) return null;

  const dateResult = parsePaymentDate(fields.payment_date, periodYear);
  const receivedDateResult = parsePaymentDate(fields.received_date, periodYear);
  const qty = cellNum(fields.qty);
  const unitPrice = cellNum(fields.unit_price);
  const amount = cellNum(fields.amount);

  const qualityFlags = [...dateResult.flags];
  if (!isEmptyValue(fields.received_date)) {
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
    party_code: upperCode(fields.party_code),
    party_name: cellStr(fields.party_name),
    uom: cellStr(fields.uom),
    item_code: upperCode(fields.item_code),
    item_name: cellStr(fields.item_name),
    qty,
    unit_price: unitPrice,
    amount,
    plant_name: cellStr(fields.plant_name),
    expense_code: upperCode(fields.expense_code),
    payment_method: cellStr(fields.payment_method),
    description: cellStr(fields.description),
    invoice: cellStr(fields.invoice),
    note: cellStr(fields.note),
    recipient_name: cellStr(fields.recipient_name),
    quality_flags: qualityFlags,
  };
}
