export function extractPeriodYearFromFilename(filename: string): number | null {
  const m = filename.match(/(?:19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 2000 && y <= 2100 ? y : null;
}
