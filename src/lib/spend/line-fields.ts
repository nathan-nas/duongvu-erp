export const MANUAL_BATCH_FILENAME = "Nhập tay";

export type SpendLineFields = {
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

export function emptySpendLineFields(): SpendLineFields {
  return {
    payment_date: null,
    received_date: null,
    party_code: null,
    party_name: null,
    item_code: null,
    item_name: null,
    uom: null,
    qty: null,
    unit_price: null,
    amount: null,
    plant_name: null,
    expense_code: null,
    payment_method: null,
    description: null,
    invoice: null,
    note: null,
    recipient_name: null,
  };
}

export function resolveAmount(fields: SpendLineFields): number | null {
  if (fields.amount != null && Number.isFinite(fields.amount)) {
    return fields.amount;
  }
  if (
    fields.qty != null &&
    fields.unit_price != null &&
    Number.isFinite(fields.qty) &&
    Number.isFinite(fields.unit_price)
  ) {
    return fields.qty * fields.unit_price;
  }
  return null;
}
