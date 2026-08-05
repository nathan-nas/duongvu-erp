import { describe, expect, it } from "vitest";
import { SPEND_LINE_COLUMNS } from "./line-table-columns";

describe("SPEND_LINE_COLUMNS", () => {
  it("matches the requested Excel column order", () => {
    expect(
      SPEND_LINE_COLUMNS.map(({ key, label }) => [key, label]),
    ).toEqual([
      ["row_number", "STT"],
      ["payment_date", "Ngày chi tiền"],
      ["party_name", "NCC"],
      ["received_date", "Ngày nhập hàng"],
      ["item_name", "Loại hàng"],
      ["uom", "ĐV tính"],
      ["qty", "Số lượng"],
      ["unit_price", "Đơn giá"],
      ["amount", "Thành tiền"],
      ["description", "Diễn giải"],
      ["recipient_name", "Người mua/nhận"],
      ["plant_name", "Nhà máy"],
      ["invoice", "Số HĐ"],
    ]);
  });
});
