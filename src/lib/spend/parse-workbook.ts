import * as XLSX from "xlsx";
import { classifyBatchKind } from "./classify-batch";
import { mapFactRow } from "./map-fact-row";
import { extractPeriodYearFromFilename } from "./period-year";
import type { ParsedWorkbookPreview } from "./types";

const REQUIRED_SHEET_NAMES = [
  "V\u1eacT T\u01af NH\u00c0 M\u00c1Y",
  "V\u1eacT T\u01af XE",
] as const;

function normalizeSheetName(name: string) {
  return name
    .normalize("NFC")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/\u0110/g, "D")
    .replace(/\s+/g, "");
}

function hasExpectedHeaders(row: unknown[]) {
  const headers = row.map((cell) => String(cell ?? "").normalize("NFC").toUpperCase());
  return headers.some((header) => header.includes("TH\u00c0NH TI\u1ec0N")) &&
    headers.some((header) => header.includes("NG\u00c0Y"));
}

function dateCellValue(cell: XLSX.CellObject | undefined, date1904: boolean) {
  if (!cell || cell.v instanceof Date || typeof cell.v !== "number") {
    return cell?.v;
  }
  if (!cell.z || !XLSX.SSF.is_date(cell.z)) return cell.v;

  const date = XLSX.SSF.parse_date_code(cell.v, { date1904 });
  return date ? new Date(date.y, date.m - 1, date.d) : cell.v;
}

function parseRequiredSheet(
  workbook: XLSX.WorkBook,
  actualSheetName: string,
  sheetName: string,
  periodYear: number,
  date1904: boolean,
) {
  const sheet = workbook.Sheets[actualSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
  });
  const headerRowIndex = rows.slice(0, 10).findIndex(hasExpectedHeaders);
  if (headerRowIndex < 0) return null;

  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  const dataRows = rows.slice(headerRowIndex + 1).map((row, index) => {
    const sheetRow = headerRowIndex + 1 + index;
    const paymentDateCell = sheet[
      XLSX.utils.encode_cell({ r: range.s.r + sheetRow, c: 0 })
    ];
    const receivedDateCell = sheet[
      XLSX.utils.encode_cell({ r: range.s.r + sheetRow, c: 14 })
    ];
    const normalizedRow = [...row];
    normalizedRow[0] = dateCellValue(paymentDateCell, date1904);
    normalizedRow[14] = dateCellValue(receivedDateCell, date1904);
    return normalizedRow;
  });
  const lines = dataRows
    .map((row) => mapFactRow(row, periodYear))
    .filter((row): row is NonNullable<typeof row> => row !== null);
  const amountSum = lines.reduce(
    (sum, line) => sum + (line.amount ?? 0),
    0,
  );

  return {
    lines,
    summary: { sheetName, factRows: lines.length, amountSum },
  };
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
  const requiredSheets = REQUIRED_SHEET_NAMES.map((sheetName) => ({
    sheetName,
    actualSheetName: sheetNames.find(
      (name) => normalizeSheetName(name) === normalizeSheetName(sheetName),
    ),
  }));
  const missingSheetNames = requiredSheets
    .filter(({ actualSheetName }) => !actualSheetName)
    .map(({ sheetName }) => sheetName);

  const invalidPreview = (
    unreadableSheetNames: string[],
  ): ParsedWorkbookPreview => ({
    sheetNames,
    hasFactSheet: false,
    missingSheetNames,
    unreadableSheetNames,
    sheetSummaries: [],
    batchKind,
    suggestedPeriodYear,
    lines: [],
    factRows: 0,
    amountSum: 0,
  });

  if (missingSheetNames.length > 0) {
    return invalidPreview([]);
  }

  const periodYear =
    periodYearOverride ?? suggestedPeriodYear ?? new Date().getFullYear();
  const date1904 = workbook.Workbook?.WBProps?.date1904 === true;
  const parsedSheets = requiredSheets.map(({ sheetName, actualSheetName }) => ({
    sheetName,
    result: actualSheetName
      ? parseRequiredSheet(
          workbook,
          actualSheetName,
          sheetName,
          periodYear,
          date1904,
        )
      : null,
  }));
  const unreadableSheetNames = parsedSheets
    .filter(({ result }) => result === null)
    .map(({ sheetName }) => sheetName);

  if (unreadableSheetNames.length > 0) {
    return invalidPreview(unreadableSheetNames);
  }

  const readableSheets = parsedSheets.flatMap(({ result }) =>
    result ? [result] : [],
  );
  const lines = readableSheets.flatMap(({ lines: sheetLines }) => sheetLines);
  const sheetSummaries = readableSheets.map(({ summary }) => summary);

  return {
    sheetNames,
    hasFactSheet: true,
    missingSheetNames: [],
    unreadableSheetNames: [],
    sheetSummaries,
    batchKind,
    suggestedPeriodYear,
    lines,
    factRows: lines.length,
    amountSum: sheetSummaries.reduce(
      (sum, summary) => sum + summary.amountSum,
      0,
    ),
  };
}
