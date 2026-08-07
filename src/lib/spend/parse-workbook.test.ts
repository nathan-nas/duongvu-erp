import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseSpendWorkbook } from "./parse-workbook";

function workbookBuffer(): ArrayBuffer {
  const factSheet = XLSX.utils.aoa_to_sheet([
    ["REPORT"],
    [],
    [
      "Ngày",
      "Party code",
      "Party name",
      "UOM",
      "Item code",
      "Item name",
      "Quantity",
      "Unit price",
      "THÀNH TIỀN",
      "Description",
      "Kho",
      "Plant",
      "Expense code",
      "Recipient",
      "Received date",
    ],
    [
      45658,
      "nm90",
      "Partner",
      "Piece",
      "db77",
      "Item B77",
      6,
      53000,
      318000,
      "Mua",
      "Kho",
      "Factory",
      "t53",
      "CHINH",
      45659,
    ],
  ]);
  factSheet.A4.z = "dd/mm/yyyy";
  factSheet.O4.z = "dd/mm/yyyy";

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Plant"]]), "NM01");
  XLSX.utils.book_append_sheet(workbook, factSheet, "Vật tư Nhà máy");
  XLSX.utils.book_append_sheet(workbook, factSheet, "VẬT TƯ XE");
  XLSX.utils.book_append_sheet(workbook, factSheet, "BANG CHI TIET");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("parseSpendWorkbook", () => {
  it("merges both required sheets and ignores the legacy sheet", () => {
    const preview = parseSpendWorkbook(workbookBuffer(), "vat-tu-T5-2025.xlsx");

    expect(preview.hasFactSheet).toBe(true);
    expect(preview.missingSheetNames).toEqual([]);
    expect(preview.unreadableSheetNames).toEqual([]);
    expect(preview.batchKind).toBe("period");
    expect(preview.suggestedPeriodYear).toBe(2025);
    expect(preview.factRows).toBe(2);
    expect(preview.amountSum).toBe(636000);
    expect(preview.sheetSummaries).toEqual([
      { sheetName: "VẬT TƯ NHÀ MÁY", factRows: 1, amountSum: 318000 },
      { sheetName: "VẬT TƯ XE", factRows: 1, amountSum: 318000 },
    ]);
    expect(preview.lines).toHaveLength(2);
    expect(preview.lines[0]).toEqual(
      expect.objectContaining({
        payment_date: "2025-01-01",
        party_code: "NM90",
        item_code: "DB77",
        amount: 318000,
        recipient_name: "CHINH",
        received_date: "2025-01-02",
      }),
    );
  });

  it("uses an overridden period year when mapping rows", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Ngày", "", "", "", "", "", "", "", "THÀNH TIỀN"],
      [412, "", "", "", "", "", "", "", 100],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "VẬT TƯ NHÀ MÁY");
    XLSX.utils.book_append_sheet(workbook, sheet, "VẬT TƯ XE");
    const preview = parseSpendWorkbook(
      XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
      "vat-tu-T5-2025.xlsx",
      2026,
    );

    expect(preview.lines[0]?.payment_date).toBe("2026-12-04");
  });

  it("rejects a workbook that is missing either required sheet", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["Ngày", "", "", "", "", "", "", "", "THÀNH TIỀN"]]),
      "VẬT TƯ NHÀ MÁY",
    );
    const preview = parseSpendWorkbook(
      XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
      "vat-tu-T5-2025.xlsx",
    );

    expect(preview.hasFactSheet).toBe(false);
    expect(preview.missingSheetNames).toEqual(["VẬT TƯ XE"]);
    expect(preview.lines).toEqual([]);
    expect(preview.sheetSummaries).toEqual([]);
  });

  it("rejects a workbook when a required sheet has no readable header", () => {
    const workbook = XLSX.utils.book_new();
    const validSheet = XLSX.utils.aoa_to_sheet([
      ["Ngày", "", "", "", "", "", "", "", "THÀNH TIỀN"],
      [412, "", "", "", "", "", "", "", 100],
    ]);
    XLSX.utils.book_append_sheet(workbook, validSheet, "VẬT TƯ NHÀ MÁY");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Sai"]]), "VẬT TƯ XE");
    const preview = parseSpendWorkbook(
      XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
      "vat-tu-T5-2025.xlsx",
    );

    expect(preview.hasFactSheet).toBe(false);
    expect(preview.unreadableSheetNames).toEqual(["VẬT TƯ XE"]);
    expect(preview.lines).toEqual([]);
  });
});
