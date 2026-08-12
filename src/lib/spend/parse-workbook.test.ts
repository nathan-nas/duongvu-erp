import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseSpendWorkbook } from "./parse-workbook";

function workbookBuffer(sheets: Array<[string, XLSX.WorkSheet]>): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, sheet] of sheets) {
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

function sttFirstSheet(values: unknown[], note?: string): XLSX.WorkSheet {
  const dataRow = [...values];
  dataRow[17] = note ?? "";
  const sheet = XLSX.utils.aoa_to_sheet([
    [
      "STT",
      "NGÀY CHI TIỀN",
      "MÃ KH",
      "NCC",
      "ĐV TÍNH",
      "MÃ HÀNG",
      "LOẠI HÀNG",
      "SỐ LƯỢNG",
      "ĐƠN GIÁ",
      "THÀNH TIỀN",
      "DIỄN GIẢI",
      "NHÀ MÁY",
      "MÃ CHI",
      "NGƯỜI MUA/NHẬN",
      "NGÀY NHẬP HÀNG",
      "HÌNH THỨC THANH TOÁN",
      "SỐ HĐ",
      "GHI CHÚ",
    ],
    ["", "", "", "", "", "", "", "", "", 99_999_999],
    dataRow,
  ]);
  sheet.B3.z = "dd/mm/yyyy";
  sheet.O3.z = "dd/mm/yyyy";
  return sheet;
}

describe("parseSpendWorkbook", () => {
  it("maps STT-first headers, skips totals, and merges required sheets", () => {
    const preview = parseSpendWorkbook(
      workbookBuffer([
        [
          "Vật tư Nhà máy",
          sttFirstSheet([
            1,
            45658,
            "nm90",
            "CÔNG TY TNHH MTV TÍN THỊNH",
            "Cái",
            "db77",
            "Dây curoa B77",
            6,
            2_304_000,
            13_824_000,
            "Mua",
            "NHÀ MÁY",
            "t53",
            "S DƯƠNG",
            45659,
            "TM",
            "HD1",
          ]),
        ],
        [
          "VẬT TƯ XE",
          sttFirstSheet([
            1,
            45658,
            "xe01",
            "CÔNG TY XE",
            "Lần",
            "X01",
            "Dầu xe",
            1,
            500_000,
            500_000,
            "Mua",
            "",
            "x01",
            "A",
            45659,
            "CK",
            "HD2",
          ], "Ghi cho xe"),
        ],
        ["MÃ NCC", XLSX.utils.aoa_to_sheet([["MÃ NCC"]])],
      ]),
      "vat-tu-T5-2025.xlsx",
    );

    expect(preview.hasFactSheet).toBe(true);
    expect(preview.missingSheetNames).toEqual([]);
    expect(preview.unreadableSheetNames).toEqual([]);
    expect(preview.batchKind).toBe("period");
    expect(preview.suggestedPeriodYear).toBe(2025);
    expect(preview.factRows).toBe(2);
    expect(preview.amountSum).toBe(14_324_000);
    expect(preview.sheetSummaries).toEqual([
      { sheetName: "VẬT TƯ NHÀ MÁY", factRows: 1, amountSum: 13_824_000 },
      { sheetName: "VẬT TƯ XE", factRows: 1, amountSum: 500_000 },
    ]);
    expect(preview.lines[0]).toEqual(
      expect.objectContaining({
        payment_date: "2025-01-01",
        party_code: "NM90",
        party_name: "CÔNG TY TNHH MTV TÍN THỊNH",
        item_code: "DB77",
        amount: 13_824_000,
        plant_name: "NHÀ MÁY",
        recipient_name: "S DƯƠNG",
        received_date: "2025-01-02",
      }),
    );
    expect(preview.lines[1]).toEqual(
      expect.objectContaining({ note: "Ghi cho xe" }),
    );
  });

  it("maps legacy aliases without an STT column", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["NGAY CHI TIEN", "MA KH", "TEN CUA HANG", "THANH TIEN"],
      ["2/12", "ncc01", "Nhà cung cấp cũ", 100],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "VẬT TƯ NHÀ MÁY");
    XLSX.utils.book_append_sheet(workbook, sheet, "VẬT TƯ XE");

    const preview = parseSpendWorkbook(
      XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
      "vat-tu-T5-2025.xlsx",
    );

    expect(preview.lines[0]).toEqual(
      expect.objectContaining({
        payment_date: "2025-12-02",
        party_name: "Nhà cung cấp cũ",
        amount: 100,
      }),
    );
  });

  it("uses an overridden period year when mapping rows", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["NGÀY CHI TIỀN", "THÀNH TIỀN"],
      [412, 100],
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
      XLSX.utils.aoa_to_sheet([["NGÀY CHI TIỀN", "THÀNH TIỀN"]]),
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
      ["NGÀY CHI TIỀN", "THÀNH TIỀN"],
      [412, 100],
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
