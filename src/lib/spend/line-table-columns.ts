export type SpendLineColumnKey =
  | "row_number"
  | "payment_date"
  | "party_name"
  | "received_date"
  | "item_name"
  | "uom"
  | "qty"
  | "unit_price"
  | "amount"
  | "description"
  | "recipient_name"
  | "plant_name"
  | "invoice";

export type SpendLineSortKey = Exclude<SpendLineColumnKey, "row_number">;

export const SPEND_LINE_COLUMNS: ReadonlyArray<{
  key: SpendLineColumnKey;
  label: string;
  align?: "right";
}> = [
  { key: "row_number", label: "STT", align: "right" },
  { key: "payment_date", label: "Ngày chi tiền" },
  { key: "party_name", label: "NCC" },
  { key: "received_date", label: "Ngày nhập hàng" },
  { key: "item_name", label: "Loại hàng" },
  { key: "uom", label: "ĐV tính" },
  { key: "qty", label: "Số lượng", align: "right" },
  { key: "unit_price", label: "Đơn giá", align: "right" },
  { key: "amount", label: "Thành tiền", align: "right" },
  { key: "description", label: "Diễn giải" },
  { key: "recipient_name", label: "Người mua/nhận" },
  { key: "plant_name", label: "Nhà máy" },
  { key: "invoice", label: "Số HĐ" },
];
