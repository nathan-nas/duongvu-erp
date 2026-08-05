export type BatchKind = "annual" | "period" | "unknown";

export type SpendLineDraft = {
  payment_date: string | null;
  payment_date_raw: string | null;
  received_date: string | null;
  received_date_raw: string | null;
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
  quality_flags: string[];
};

export type ParsedWorkbookPreview = {
  sheetNames: string[];
  hasFactSheet: boolean;
  batchKind: BatchKind;
  suggestedPeriodYear: number | null;
  lines: SpendLineDraft[];
  factRows: number;
  amountSum: number;
};
