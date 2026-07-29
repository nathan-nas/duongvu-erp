import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseSpendWorkbook } from "./parse-workbook";

function workbookBuffer(): ArrayBuffer {
  const factSheet = XLSX.utils.aoa_to_sheet([
    ["BÁO CÁO CHI TIẾT"],
    [],
    [
      "Ngày",
      "Mã đối tác",
      "Tên đối tác",
      "ĐVT",
      "Mã hàng",
      "Tên hàng",
      "Số lượng",
      "Đơn giá",
      "THÀNH TIỀN",
      "Diễn giải",
      "Kho",
      "Nhà máy",
      "Mã chi phí",
    ],
    [
      45658,
      "nm90",
      "Thiên Nam Phát",
      "Cái",
      "db77",
      "Dây curoa B77",
      6,
      53000,
      318000,
      "Mua",
      "Kho",
      "Máy Cám",
      "t53",
    ],
  ]);
  factSheet.A4.z = "dd/mm/yyyy";

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Plant"]]), "NM01");
  XLSX.utils.book_append_sheet(workbook, factSheet, "BẢNG CHI TIẾT");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("parseSpendWorkbook", () => {
  it("maps fact rows from the normalized BẢNG CHI TIẾT sheet", () => {
    const preview = parseSpendWorkbook(workbookBuffer(), "vật tư T5-2025.xlsx");

    expect(preview.hasFactSheet).toBe(true);
    expect(preview.batchKind).toBe("period");
    expect(preview.suggestedPeriodYear).toBe(2025);
    expect(preview.factRows).toBe(1);
    expect(preview.amountSum).toBe(318000);
    expect(preview.lines).toEqual([
      expect.objectContaining({
        payment_date: "2025-01-01",
        party_code: "NM90",
        item_code: "DB77",
        amount: 318000,
      }),
    ]);
  });

  it("uses an overridden period year when mapping rows", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Ngày", "", "", "", "", "", "", "", "THÀNH TIỀN"],
      [412, "", "", "", "", "", "", "", 100],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "BANG CHI TIET");
    const preview = parseSpendWorkbook(
      XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
      "vật tư T5-2025.xlsx",
      2026,
    );

    expect(preview.lines[0]?.payment_date).toBe("2026-12-04");
  });
});
