import type { BatchKind } from "./types";

export function classifyBatchKind(
  filename: string,
  sheetNames: string[],
): BatchKind {
  void sheetNames; // reserved for Task 4 sheet-based classification
  const upper = filename.toUpperCase();
  if (upper.includes("NĂM") || upper.includes("NAM 20")) {
    return "annual";
  }
  if (upper.includes("VAT TU") || /T\d{1,2}-20/.test(upper)) {
    return "period";
  }
  return "unknown";
}
