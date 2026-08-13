"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { ArrowUpDown, Columns3 } from "lucide-react";
import { TableVirtuoso } from "react-virtuoso";
import { getTableColumnPrefs, upsertTableColumnPrefs } from "@/api/table-prefs";
import { Button } from "@/components/ui/button";
import {
  clampWidth,
  mergeColumnPrefs,
  reorderColumnOrder,
} from "@/lib/table-prefs/merge-column-prefs";
import type {
  TableColumnPrefPayload,
  TablePrefId,
} from "@/lib/table-prefs/types";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 400;
const DEFAULT_WIDTH = 140;
const VIRTUALIZE_MIN = 40;

export type DataTableColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right";
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  hideable?: boolean;
  cell: (row: T, index: number) => ReactNode;
};

export type DataTableTrailingColumn<T> = {
  id?: string;
  label: string;
  width?: number;
  cell: (row: T, index: number) => ReactNode;
};

type SortDir = "asc" | "desc";

type PrefsContextValue = {
  tableId: TablePrefId;
  columns: DataTableColumn<unknown>[];
  prefs: TableColumnPrefPayload;
  setPrefs: (
    updater: (prev: TableColumnPrefPayload) => TableColumnPrefPayload,
  ) => void;
  orderedVisible: DataTableColumn<unknown>[];
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

function usePrefsContext() {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    throw new Error("DataTable components must be used within DataTable.Root");
  }
  return ctx;
}

function useDebouncedSave(
  tableId: TablePrefId,
  prefs: TableColumnPrefPayload,
  enabled: boolean,
  skipNextSaveRef: MutableRefObject<boolean>,
) {
  const pendingRef = useRef<{
    tableId: TablePrefId;
    prefs: TableColumnPrefPayload;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      pendingRef.current = null;
      return;
    }
    pendingRef.current = { tableId, prefs };
    const handle = window.setTimeout(() => {
      pendingRef.current = null;
      void upsertTableColumnPrefs(tableId, prefs);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [tableId, prefs, enabled, skipNextSaveRef]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        void upsertTableColumnPrefs(pending.tableId, pending.prefs);
      }
    };
  }, []);
}

type RootProps<T> = {
  tableId: TablePrefId;
  columns: DataTableColumn<T>[];
  children: ReactNode;
};

function Root<T>({ tableId, columns, children }: RootProps<T>) {
  const metas = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        defaultWidth: c.defaultWidth,
        minWidth: c.minWidth,
        maxWidth: c.maxWidth,
        hideable: c.hideable,
        resizable: c.resizable,
        reorderable: c.reorderable,
      })),
    [columns],
  );

  const [prefs, setPrefsState] = useState<TableColumnPrefPayload>(() =>
    mergeColumnPrefs(metas, null),
  );
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    dirtyRef.current = false;
    skipNextSaveRef.current = true;
    void (async () => {
      const result = await getTableColumnPrefs(tableId);
      if (cancelled) return;
      if (dirtyRef.current) {
        // Keep in-flight edits and persist them after hydrate.
        skipNextSaveRef.current = false;
      } else if ("prefs" in result) {
        skipNextSaveRef.current = true;
        setPrefsState(mergeColumnPrefs(metas, result.prefs));
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tableId, metas]);

  const setPrefs = useCallback(
    (updater: (prev: TableColumnPrefPayload) => TableColumnPrefPayload) => {
      dirtyRef.current = true;
      setPrefsState((prev) => mergeColumnPrefs(metas, updater(prev)));
    },
    [metas],
  );

  useDebouncedSave(tableId, prefs, hydrated, skipNextSaveRef);

  const orderedVisible = useMemo(() => {
    const byId = new Map(
      (columns as DataTableColumn<unknown>[]).map((c) => [c.id, c]),
    );
    const visible = new Set(prefs.visibleIds);
    return prefs.columnOrder
      .filter((id) => visible.has(id))
      .map((id) => byId.get(id))
      .filter((c): c is DataTableColumn<unknown> => c != null);
  }, [columns, prefs.columnOrder, prefs.visibleIds]);

  const value = useMemo<PrefsContextValue>(
    () => ({
      tableId,
      columns: columns as DataTableColumn<unknown>[],
      prefs,
      setPrefs,
      orderedVisible,
    }),
    [tableId, columns, prefs, setPrefs, orderedVisible],
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

function ColumnPicker({ className }: { className?: string }) {
  const { columns, prefs, setPrefs } = usePrefsContext();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hideable = columns.filter((c) => c.hideable !== false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(id: string) {
    setPrefs((prev) => {
      const next = new Set(prev.visibleIds);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, visibleIds: [...next] };
    });
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-label="Chọn cột hiển thị"
        onClick={() => setOpen((v) => !v)}
      >
        <Columns3 className="size-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-52 origin-top-right animate-in fade-in-0 zoom-in-95 rounded-md border bg-popover p-3 shadow-md duration-150">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Cột hiển thị
          </p>
          <ul className="grid gap-2">
            {hideable.map((col) => (
              <li key={col.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-primary"
                    checked={prefs.visibleIds.includes(col.id)}
                    onChange={() => toggle(col.id)}
                  />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type TableProps<T> = {
  rows: T[];
  getRowId: (row: T) => string;
  sortKey?: string | null;
  sortDir?: SortDir;
  onSort?: (columnId: string) => void;
  virtualize?: boolean;
  virtualHeight?: number;
  rowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  trailingColumn?: DataTableTrailingColumn<T>;
  className?: string;
  emptyMessage?: string;
};

function TableView<T>({
  rows,
  getRowId,
  sortKey = null,
  sortDir = "asc",
  onSort,
  virtualize,
  virtualHeight = 560,
  rowClassName,
  onRowClick,
  trailingColumn,
  className,
  emptyMessage = "Không có dữ liệu.",
}: TableProps<T>) {
  const { orderedVisible, prefs, setPrefs } = usePrefsContext();
  const columns = orderedVisible as DataTableColumn<T>[];
  const dragId = useRef<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const resizing = useRef<{
    id: string;
    startX: number;
    startW: number;
  } | null>(null);

  const trailingWidth = trailingColumn?.width ?? 96;
  const totalWidth =
    columns.reduce((sum, col) => sum + (prefs.widths[col.id] ?? DEFAULT_WIDTH), 0) +
    (trailingColumn ? trailingWidth : 0);

  const shouldVirtualize =
    virtualize ?? rows.length >= VIRTUALIZE_MIN;

  function onResizeStart(
    event: ReactMouseEvent,
    col: DataTableColumn<T>,
  ) {
    if (col.resizable === false) return;
    event.preventDefault();
    event.stopPropagation();
    const startW = prefs.widths[col.id] ?? col.defaultWidth ?? DEFAULT_WIDTH;
    resizing.current = { id: col.id, startX: event.clientX, startW };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(e: MouseEvent) {
      const state = resizing.current;
      if (!state) return;
      const meta = columns.find((c) => c.id === state.id);
      const next = clampWidth(state.startW + (e.clientX - state.startX), meta);
      setPrefs((prev) => ({
        ...prev,
        widths: { ...prev.widths, [state.id]: next },
      }));
    }

    function onUp() {
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    setPrefs((prev) => ({
      ...prev,
      columnOrder: reorderColumnOrder(prev.columnOrder, fromId, toId),
    }));
  }

  function headerCell(col: DataTableColumn<T>) {
    const width = prefs.widths[col.id] ?? col.defaultWidth ?? DEFAULT_WIDTH;
    const canReorder = col.reorderable !== false;
    const canResize = col.resizable !== false;
    const alignRight = col.align === "right";

    return (
      <th
        key={col.id}
        draggable={canReorder}
        onDragStart={() => {
          dragId.current = col.id;
        }}
        onDragOver={(e) => {
          if (!canReorder) return;
          e.preventDefault();
          if (dropTargetId !== col.id) setDropTargetId(col.id);
        }}
        onDragLeave={() => {
          if (dropTargetId === col.id) setDropTargetId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const from = dragId.current;
          dragId.current = null;
          setDropTargetId(null);
          if (from) reorder(from, col.id);
        }}
        onDragEnd={() => {
          dragId.current = null;
          setDropTargetId(null);
        }}
        style={{ width, minWidth: width, maxWidth: width }}
        aria-sort={
          sortKey === col.id
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
        className={cn(
          "relative whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground select-none",
          alignRight && "text-right",
          canReorder && "cursor-grab active:cursor-grabbing",
          dropTargetId === col.id && "bg-primary/10",
        )}
      >
        {col.sortable && onSort ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => onSort(col.id)}
          >
            {col.label}
            <ArrowUpDown
              className={cn(
                "size-3",
                sortKey === col.id
                  ? "text-foreground"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ) : (
          col.label
        )}
        {canResize ? (
          <span
            role="separator"
            aria-orientation="vertical"
            aria-label={`Đổi độ rộng cột ${col.label}`}
            draggable={false}
            className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize bg-transparent transition-colors duration-150 hover:bg-primary/30"
            onMouseDown={(e) => onResizeStart(e, col)}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : null}
      </th>
    );
  }

  const headerRow = (
    <tr>
      {columns.map((col) => headerCell(col))}
      {trailingColumn ? (
        <th
          style={{
            width: trailingWidth,
            minWidth: trailingWidth,
            maxWidth: trailingWidth,
          }}
          className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-muted-foreground"
        >
          {trailingColumn.label}
        </th>
      ) : null}
    </tr>
  );

  const colgroup = (
    <colgroup>
      {columns.map((col) => {
        const width = prefs.widths[col.id] ?? col.defaultWidth ?? DEFAULT_WIDTH;
        return <col key={col.id} style={{ width }} />;
      })}
      {trailingColumn ? <col style={{ width: trailingWidth }} /> : null}
    </colgroup>
  );

  function renderCells(row: T, index: number) {
    return (
      <>
        {columns.map((col) => (
          <td
            key={col.id}
            style={{
              width: prefs.widths[col.id] ?? col.defaultWidth ?? DEFAULT_WIDTH,
              maxWidth: prefs.widths[col.id] ?? col.defaultWidth ?? DEFAULT_WIDTH,
            }}
            className={cn(
              "overflow-hidden px-4 py-2.5 text-xs text-ellipsis",
              col.align === "right" && "text-right tabular-nums",
            )}
          >
            {col.cell(row, index)}
          </td>
        ))}
        {trailingColumn ? (
          <td
            style={{ width: trailingWidth }}
            className="whitespace-nowrap px-2 py-1.5 text-right"
          >
            {trailingColumn.cell(row, index)}
          </td>
        ) : null}
      </>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const tableStyle: CSSProperties = {
    width: totalWidth,
    minWidth: "100%",
    tableLayout: "fixed",
  };

  if (shouldVirtualize) {
    return (
      <TableVirtuoso
        style={{ height: virtualHeight }}
        data={rows}
        className={cn("text-sm", className)}
        fixedHeaderContent={() => headerRow}
        itemContent={(index, row) => renderCells(row, index)}
        components={{
          Table: ({ style, children, ...tableProps }) => (
            <table
              {...tableProps}
              className="text-left text-sm"
              style={{ ...style, ...tableStyle }}
            >
              {colgroup}
              {children}
            </table>
          ),
          TableHead: (headProps) => (
            <thead
              {...headProps}
              className="border-b bg-muted/90 backdrop-blur"
            />
          ),
          TableRow: (rowProps) => {
            const index = Number(
              (rowProps as { "data-index"?: number })["data-index"],
            );
            const row = Number.isFinite(index) ? rows[index] : undefined;
            return (
              <tr
                {...rowProps}
                className={cn(
                  "hover:bg-muted/30",
                  onRowClick && "cursor-pointer",
                  row ? rowClassName?.(row) : undefined,
                )}
                onClick={
                  onRowClick && row
                    ? () => onRowClick(row)
                    : undefined
                }
              />
            );
          },
        }}
      />
    );
  }

  return (
    <table className={cn("text-left text-sm", className)} style={tableStyle}>
      {colgroup}
      <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
        {headerRow}
      </thead>
      <tbody className="divide-y">
        {rows.map((row, index) => (
          <tr
            key={getRowId(row)}
            className={cn(
              "hover:bg-muted/30",
              onRowClick && "cursor-pointer",
              rowClassName?.(row),
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {renderCells(row, index)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const DataTable = {
  Root,
  ColumnPicker,
  Table: TableView,
};
