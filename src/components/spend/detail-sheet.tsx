"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableTrailingColumn,
} from "@/components/ui/data-table";
import type { AnalyticsLine } from "@/api/analytics";
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { formatVnd, formatViDate } from "@/lib/spend/format";
import {
  SPEND_LINE_COLUMNS,
  type SpendLineColumnKey,
  type SpendLineSortKey,
} from "@/lib/spend/line-table-columns";
import { cn } from "@/lib/utils";
import { SpendLineDeleteDialog } from "./spend-line-delete-dialog";
import { SpendLineFormDialog } from "./spend-line-form-dialog";

type LinesProps = {
  title: string;
  totalAmount: number;
  lines: AnalyticsLine[];
  totalCount?: number;
  loading?: boolean;
  error?: string | null;
  editable?: boolean;
  showClose?: boolean;
  onLinesChanged?: () => void;
  groups?: never;
  groupLabel?: never;
  onGroupClick?: never;
  selectedGroupLabel?: never;
  onClose: () => void;
};

type GroupsProps = {
  title: string;
  totalAmount: number;
  groups: SpendAggregate[];
  groupLabel: string;
  lines?: never;
  totalCount?: never;
  loading?: boolean;
  error?: string | null;
  editable?: never;
  showClose?: boolean;
  onLinesChanged?: never;
  onGroupClick?: (label: string) => void;
  selectedGroupLabel?: string | null;
  onClose: () => void;
};

type Props = LinesProps | GroupsProps;

type GroupSortKey = "label" | "amount" | "count";
type SortDir = "asc" | "desc";

function compareLine(
  a: AnalyticsLine,
  b: AnalyticsLine,
  key: SpendLineSortKey,
): number {
  const av = a[key];
  const bv = b[key];
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), "vi");
}

function lineCellContent(
  line: AnalyticsLine,
  key: SpendLineColumnKey,
  rowNumber: number,
): ReactNode {
  switch (key) {
    case "row_number":
      return (
        <span className="tabular-nums">{rowNumber.toLocaleString("vi-VN")}</span>
      );
    case "payment_date":
      return formatViDate(line.payment_date);
    case "party_name":
      return (
        <div className="truncate font-medium" title={line.party_name ?? undefined}>
          {line.party_name ?? "—"}
        </div>
      );
    case "received_date":
      return line.received_date ? formatViDate(line.received_date) : "—";
    case "item_name":
      return (
        <div className="truncate" title={line.item_name ?? undefined}>
          {line.item_name ?? "—"}
        </div>
      );
    case "uom":
      return line.uom ?? "—";
    case "qty":
      return line.qty != null ? line.qty.toLocaleString("vi-VN") : "—";
    case "unit_price":
      return line.unit_price != null ? formatVnd(line.unit_price) : "—";
    case "amount":
      return (
        <span className="font-semibold">
          {line.amount != null ? formatVnd(line.amount) : "—"}
        </span>
      );
    case "description":
      return (
        <span className="truncate" title={line.description ?? undefined}>
          {line.description ?? "—"}
        </span>
      );
    case "recipient_name":
      return (
        <span className="truncate" title={line.recipient_name ?? undefined}>
          {line.recipient_name ?? "—"}
        </span>
      );
    case "plant_name":
      return line.plant_name ? (
        <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {line.plant_name}
        </span>
      ) : (
        "—"
      );
    case "invoice":
      return line.invoice ?? "—";
  }
}

const LINE_DEFAULT_WIDTHS: Partial<Record<SpendLineColumnKey, number>> = {
  row_number: 64,
  payment_date: 120,
  party_name: 160,
  received_date: 120,
  item_name: 180,
  uom: 72,
  qty: 88,
  unit_price: 110,
  amount: 120,
  description: 200,
  recipient_name: 140,
  plant_name: 100,
  invoice: 100,
};

export function DetailSheet(props: Props) {
  const { title, totalAmount, onClose } = props;
  const isGroups = "groups" in props && props.groups != null;
  const editable = !isGroups && props.editable !== false;
  const onGroupClick = isGroups ? props.onGroupClick : undefined;
  const selectedGroupLabel = isGroups ? props.selectedGroupLabel : null;
  const showClose = props.showClose !== false;

  const [lineSortKey, setLineSortKey] = useState<SpendLineSortKey | null>(null);
  const [groupSortKey, setGroupSortKey] = useState<GroupSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<
    { kind: "create" } | { kind: "edit"; line: AnalyticsLine } | null
  >(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLine, setDeleteLine] = useState<AnalyticsLine | null>(null);

  const sortedLines = useMemo(() => {
    if (isGroups || !props.lines) return [];
    if (!lineSortKey) return props.lines;
    const sorted = [...props.lines].sort((a, b) => compareLine(a, b, lineSortKey));
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [isGroups, props, lineSortKey, sortDir]);

  const sortedGroups = useMemo(() => {
    if (!isGroups || !props.groups) return [];
    if (!groupSortKey) return props.groups;
    const sorted = [...props.groups].sort((a, b) => {
      if (groupSortKey === "label") return a.label.localeCompare(b.label, "vi");
      return a[groupSortKey] - b[groupSortKey];
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [isGroups, props, groupSortKey, sortDir]);

  function handleLineSort(key: string) {
    const sortKey = key as SpendLineSortKey;
    if (lineSortKey === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setLineSortKey(sortKey);
      setSortDir("asc");
    }
  }

  function handleGroupSort(key: string) {
    const sortKey = key as GroupSortKey;
    if (groupSortKey === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setGroupSortKey(sortKey);
      setSortDir(sortKey === "amount" || sortKey === "count" ? "desc" : "asc");
    }
  }

  const lineCountLabel = !isGroups
    ? (props.totalCount ?? props.lines?.length ?? 0)
    : 0;

  const subtitle = isGroups
    ? `${formatVnd(totalAmount)} — ${props.groups!.length.toLocaleString("vi-VN")} nhóm`
    : `${formatVnd(totalAmount)} — ${lineCountLabel.toLocaleString("vi-VN")} dòng`;

  const lineColumns = useMemo<DataTableColumn<AnalyticsLine>[]>(
    () =>
      SPEND_LINE_COLUMNS.map((col) => ({
        id: col.key,
        label: col.label,
        align: col.align,
        defaultWidth: LINE_DEFAULT_WIDTHS[col.key] ?? 140,
        minWidth: col.key === "row_number" ? 48 : 64,
        sortable: col.key !== "row_number",
        reorderable: col.key !== "row_number",
        hideable: true,
        cell: (line, index) => lineCellContent(line, col.key, index + 1),
      })),
    [],
  );

  const groupColumns = useMemo<DataTableColumn<SpendAggregate>[]>(
    () => [
      {
        id: "label",
        label: props.groupLabel ?? "Nhóm",
        defaultWidth: 220,
        sortable: true,
        cell: (group) => (
          <span className="font-medium">{group.label}</span>
        ),
      },
      {
        id: "count",
        label: "Số dòng",
        align: "right",
        defaultWidth: 100,
        sortable: true,
        cell: (group) => group.count.toLocaleString("vi-VN"),
      },
      {
        id: "amount",
        label: "Tổng chi",
        align: "right",
        defaultWidth: 140,
        sortable: true,
        cell: (group) => (
          <span className="font-semibold">{formatVnd(group.amount)}</span>
        ),
      },
    ],
    [props.groupLabel],
  );

  const trailingColumn = useMemo<
    DataTableTrailingColumn<AnalyticsLine> | undefined
  >(() => {
    if (!editable) return undefined;
    return {
      label: "Thao tác",
      width: 96,
      cell: (line) => (
        <div className="inline-flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Sửa dòng"
            onClick={(e) => {
              e.stopPropagation();
              setFormMode({ kind: "edit", line });
              setFormOpen(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Xóa dòng"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteLine(line);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    };
  }, [editable]);

  function handleMutated() {
    props.onLinesChanged?.();
  }

  return (
    <Card className="motion-enter shadow-sm">
      {isGroups ? (
        <DataTable.Root tableId="spend_groups" columns={groupColumns}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <DataTable.ColumnPicker />
              {showClose ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Đóng"
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-auto">
            {props.loading && (
              <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
                Đang tải…
              </p>
            )}
            {props.error && (
              <p className="mb-3 text-sm text-destructive">{props.error}</p>
            )}
            <DataTable.Table
              rows={sortedGroups}
              getRowId={(g) => g.label}
              sortKey={groupSortKey}
              sortDir={sortDir}
              onSort={handleGroupSort}
              onRowClick={
                onGroupClick ? (group) => onGroupClick(group.label) : undefined
              }
              rowClassName={(group) =>
                cn(selectedGroupLabel === group.label && "bg-primary/10")
              }
            />
          </CardContent>
        </DataTable.Root>
      ) : (
        <DataTable.Root tableId="spend_lines" columns={lineColumns}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              {editable ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormMode({ kind: "create" });
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Thêm dòng
                </Button>
              ) : null}
              <DataTable.ColumnPicker />
              {showClose ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Đóng"
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-x-auto overflow-y-auto">
            {props.loading && (
              <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
                Đang tải…
              </p>
            )}
            {props.error && (
              <p className="mb-3 text-sm text-destructive">{props.error}</p>
            )}
            <DataTable.Table
              rows={sortedLines}
              getRowId={(line) => line.id}
              sortKey={lineSortKey}
              sortDir={sortDir}
              onSort={handleLineSort}
              trailingColumn={trailingColumn}
            />
          </CardContent>

          {editable ? (
            <>
              <SpendLineFormDialog
                open={formOpen}
                mode={formMode}
                onOpenChange={setFormOpen}
                onSaved={handleMutated}
              />
              <SpendLineDeleteDialog
                open={deleteOpen}
                line={deleteLine}
                onOpenChange={setDeleteOpen}
                onDeleted={handleMutated}
              />
            </>
          ) : null}
        </DataTable.Root>
      )}
    </Card>
  );
}
