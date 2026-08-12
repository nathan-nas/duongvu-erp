export type SpendFactField =
  | "payment_date"
  | "party_code"
  | "party_name"
  | "received_date"
  | "item_code"
  | "item_name"
  | "uom"
  | "qty"
  | "unit_price"
  | "amount"
  | "description"
  | "expense_code"
  | "recipient_name"
  | "plant_name"
  | "payment_method"
  | "invoice"
  | "note";

type AliasEntry = { field: SpendFactField; alias: string };

const ALIAS_ENTRIES: AliasEntry[] = [
  { field: "payment_date", alias: "NGÀY CHI TIỀN" },
  { field: "payment_date", alias: "NGAY CHI TIEN" },
  { field: "party_code", alias: "MÃ KH" },
  { field: "party_code", alias: "MA KH" },
  { field: "party_code", alias: "MÃ NCC" },
  { field: "party_name", alias: "TÊN CỬA HÀNG" },
  { field: "party_name", alias: "TEN CUA HANG" },
  { field: "party_name", alias: "NCC" },
  { field: "received_date", alias: "NGÀY NHẬP HÀNG" },
  { field: "received_date", alias: "NGAY NHAP HANG" },
  { field: "received_date", alias: "PHIẾU NGÀY" },
  { field: "received_date", alias: "PHIEU NGAY" },
  { field: "item_code", alias: "MÃ HÀNG" },
  { field: "item_code", alias: "MA HANG" },
  { field: "item_name", alias: "LOẠI HÀNG" },
  { field: "item_name", alias: "LOAI HANG" },
  { field: "item_name", alias: "TÊN HÀNG" },
  { field: "item_name", alias: "TEN HANG" },
  { field: "uom", alias: "ĐV TÍNH" },
  { field: "uom", alias: "DV TINH" },
  { field: "uom", alias: "ĐVT" },
  { field: "uom", alias: "DVT" },
  { field: "qty", alias: "SỐ LƯỢNG" },
  { field: "qty", alias: "SO LUONG" },
  { field: "qty", alias: "S. LƯỢNG" },
  { field: "qty", alias: "S. LUONG" },
  { field: "unit_price", alias: "ĐƠN GIÁ" },
  { field: "unit_price", alias: "DON GIA" },
  { field: "amount", alias: "THÀNH TIỀN" },
  { field: "amount", alias: "THANH TIEN" },
  { field: "description", alias: "DIỄN GIẢI" },
  { field: "description", alias: "DIEN GIAI" },
  { field: "expense_code", alias: "MÃ CHI" },
  { field: "expense_code", alias: "MA CHI" },
  { field: "expense_code", alias: "MÃ NV" },
  { field: "expense_code", alias: "MA NV" },
  { field: "recipient_name", alias: "NGƯỜI MUA/NHẬN" },
  { field: "recipient_name", alias: "NGUOI MUA/NHAN" },
  { field: "recipient_name", alias: "NGƯỜI MUA" },
  { field: "recipient_name", alias: "NGUOI MUA" },
  { field: "recipient_name", alias: "NGƯỜI NHẬN" },
  { field: "recipient_name", alias: "NGUOI NHAN" },
  { field: "plant_name", alias: "NHÀ MÁY" },
  { field: "plant_name", alias: "NHA MAY" },
  { field: "plant_name", alias: "NM" },
  { field: "payment_method", alias: "HÌNH THỨC THANH TOÁN" },
  { field: "payment_method", alias: "HINH THUC THANH TOAN" },
  { field: "payment_method", alias: "THANH TOÁN" },
  { field: "payment_method", alias: "THANH TOAN" },
  { field: "invoice", alias: "HÓA ĐƠN" },
  { field: "invoice", alias: "HOA DON" },
  { field: "invoice", alias: "SỐ HĐ" },
  { field: "invoice", alias: "SO HD" },
  { field: "note", alias: "GHI CHÚ" },
  { field: "note", alias: "GHI CHU" },
];

const ORDERED_ALIASES = [...ALIAS_ENTRIES].sort(
  (a, b) => normalizeHeader(b.alias).length - normalizeHeader(a.alias).length,
);

export function normalizeHeader(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .trim()
    .normalize("NFC")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function resolveColumnMap(
  headerRow: unknown[],
): Partial<Record<SpendFactField, number>> {
  const map: Partial<Record<SpendFactField, number>> = {};

  for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
    const normalized = normalizeHeader(headerRow[colIndex]);
    if (!normalized) continue;

    for (const { field, alias } of ORDERED_ALIASES) {
      if (normalizeHeader(alias) !== normalized) continue;
      if (map[field] !== undefined) break;
      map[field] = colIndex;
      break;
    }
  }

  return map;
}

export function hasFactHeaders(headerRow: unknown[]): boolean {
  const map = resolveColumnMap(headerRow);
  return map.payment_date !== undefined && map.amount !== undefined;
}
