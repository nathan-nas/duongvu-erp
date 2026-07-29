import type { BatchKind } from "./types";

export function classifyBatchKind(
  filename: string,
  _sheetNames: string[],
): BatchKind {
  const upper = filename.toUpperCase();
  if (upper.includes("NĂM") || upper.includes("NAM 20")) {
    return "annual";
  }
  if (upper.includes("VAT TU") || /T\d{1,2}-20/.test(upper)) {
    return "period";
  }
  return "unknown";
}
