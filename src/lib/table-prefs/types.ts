export type TableColumnPrefPayload = {
  columnOrder: string[];
  visibleIds: string[];
  widths: Record<string, number>;
};

export type TableColumnDefMeta = {
  id: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  hideable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
};

export const TABLE_PREF_IDS = [
  "spend_lines",
  "spend_groups",
  "import_batches",
] as const;

export type TablePrefId = (typeof TABLE_PREF_IDS)[number];

export function isTablePrefId(value: string): value is TablePrefId {
  return (TABLE_PREF_IDS as readonly string[]).includes(value);
}
