import type { SpendLineDraft } from "./types";

export function computeAmountSum(lines: SpendLineDraft[]): number {
  return lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
}

export function serializeParsedLines(lines: SpendLineDraft[]): string {
  return JSON.stringify(lines);
}

export function deserializeParsedLines(raw: string): SpendLineDraft[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid parsed lines payload");
  }
  return parsed as SpendLineDraft[];
}
