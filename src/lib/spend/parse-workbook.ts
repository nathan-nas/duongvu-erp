import * as XLSX from "xlsx";
import { classifyBatchKind } from "./classify-batch";
import { mapFactRow } from "./map-fact-row";
import { extractPeriodYearFromFilename } from "./period-year";
import type { ParsedWorkbookPreview } from "./types";

function normalizeSheetName(name: string) {
  return name
    .normalize("NFC")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "");
}

function hasExpectedHeaders(row: unknown[]) {
  const headers = row.map((cell) => String(cell ?? "").normalize("NFC").toUpperCase());
  return headers.some((header) => header.includes("THÀNH TIỀN")) &&
    headers.some((header) => header.includes("NGÀY"));
}

function dateCellValue(cell: XLSX.CellObject | undefined, date1904: boolean) {
  if (!cell || cell.v instanceof Date || typeof cell.v !== "number") {
    return cell?.v;
  }
  if (!cell.z || !XLSX.SSF.is_date(cell.z)) return cell.v;

  const date = XLSX.SSF.parse_date_code(cell.v, { date1904 });
  return date ? new Date(date.y, date.m - 1, date.d) : cell.v;
}

export function parseSpendWorkbook(
  file: ArrayBuffer,
  filename: string,
  periodYearOverride?: number,
): ParsedWorkbookPreview {
  const workbook = XLSX.read(file, { type: "array", cellNF: true });
  const sheetNames = workbook.SheetNames;
  const batchKind = classifyBatchKind(filename, sheetNames);
  const suggestedPeriodYear = extractPeriodYearFromFilename(filename);
  const factSheetName = sheetNames.find(
    (name) => normalizeSheetName(name) === "BANGCHITIET",
  );

  if (!factSheetName) {
    return {
      sheetNames,
      hasFactSheet: false,
      batchKind,
      suggestedPeriodYear,
      lines: [],
      factRows: 0,
      amountSum: 0,
    };
  }

  const sheet = workbook.Sheets[factSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });
  const headerRowIndex = rows.slice(0, 10).findIndex(hasExpectedHeaders);
  const periodYear =
    periodYearOverride ?? suggestedPeriodYear ?? new Date().getFullYear();
  const date1904 = workbook.Workbook?.WBProps?.date1904 === true;
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  const dataRows = headerRowIndex < 0
    ? []
    : rows.slice(headerRowIndex + 1).map((row, index) => {
        const sheetRow = headerRowIndex + 1 + index;
        const dateCell = sheet[
          XLSX.utils.encode_cell({ r: range.s.r + sheetRow, c: 0 })
        ];
        return [dateCellValue(dateCell, date1904), ...row.slice(1)];
      });
  const lines = dataRows
    .map((row) => mapFactRow(row, periodYear))
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return {
    sheetNames,
    hasFactSheet: true,
    batchKind,
    suggestedPeriodYear,
    lines,
    factRows: lines.length,
    amountSum: lines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
  };
}
