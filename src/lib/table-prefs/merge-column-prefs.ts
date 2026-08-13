import type {
  TableColumnDefMeta,
  TableColumnPrefPayload,
} from "./types";

const DEFAULT_MIN = 64;
const DEFAULT_MAX = 640;
const DEFAULT_WIDTH = 140;

export function clampWidth(
  width: number,
  meta?: Pick<TableColumnDefMeta, "minWidth" | "maxWidth" | "defaultWidth">,
): number {
  const min = meta?.minWidth ?? DEFAULT_MIN;
  const max = meta?.maxWidth ?? DEFAULT_MAX;
  if (!Number.isFinite(width)) {
    return meta?.defaultWidth ?? DEFAULT_WIDTH;
  }
  return Math.min(max, Math.max(min, Math.round(width)));
}

export function mergeColumnPrefs(
  columns: ReadonlyArray<TableColumnDefMeta>,
  saved: Partial<TableColumnPrefPayload> | null | undefined,
): TableColumnPrefPayload {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const defaultIds = columns.map((c) => c.id);

  const orderFromSaved = (saved?.columnOrder ?? []).filter((id) => byId.has(id));
  const missingOrder = defaultIds.filter((id) => !orderFromSaved.includes(id));
  const columnOrder = [...orderFromSaved, ...missingOrder];

  const hideableIds = new Set(
    columns.filter((c) => c.hideable !== false).map((c) => c.id),
  );
  let visibleIds = (saved?.visibleIds ?? defaultIds).filter((id) => byId.has(id));
  if (visibleIds.length === 0) {
    visibleIds = [...defaultIds];
  }
  // Non-hideable columns stay visible
  for (const id of defaultIds) {
    if (!hideableIds.has(id) && !visibleIds.includes(id)) {
      visibleIds.push(id);
    }
  }

  const widths: Record<string, number> = {};
  for (const col of columns) {
    const raw = saved?.widths?.[col.id];
    widths[col.id] = clampWidth(
      typeof raw === "number" ? raw : (col.defaultWidth ?? DEFAULT_WIDTH),
      col,
    );
  }

  return { columnOrder, visibleIds, widths };
}

/** Move `fromId` to the position currently occupied by `toId`. */
export function reorderColumnOrder(
  order: readonly string[],
  fromId: string,
  toId: string,
): string[] {
  if (fromId === toId) return [...order];
  const next = [...order];
  const from = next.indexOf(fromId);
  const to = next.indexOf(toId);
  if (from < 0 || to < 0) return [...order];
  next.splice(from, 1);
  // After removal, indices after `from` shift left by one.
  const insertAt = from < to ? to - 1 : to;
  next.splice(insertAt, 0, fromId);
  return next;
}
