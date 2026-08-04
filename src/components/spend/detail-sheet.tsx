"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Columns3, Pencil, Plus, Trash2, X } from "lucide-react";
import { TableVirtuoso } from "react-virtuoso";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalyticsLine } from "@/api/analytics";
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { formatVnd, formatViDate } from "@/lib/spend/format";
import { cn } from "@/lib/utils";
import { SpendLineDeleteDialog } from "./spend-line-delete-dialog";
import { SpendLineFormDialog } from "./spend-line-form-dialog";

const VIRTUALIZE_MIN_ROWS = 40;
const VIRTUAL_TABLE_HEIGHT = 560;

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

type LineSortKey =
  | "payment_date"
  | "party_name"
  | "item_name"
  | "qty"
  | "unit_price"
  | "amount"
  | "plant_name"
  | "expense_code";

type GroupSortKey = "label" | "amount" | "count";
type SortDir = "asc" | "desc";

const lineColumns: { key: LineSortKey; label: string; align?: "right" }[] = [
  { key: "payment_date", label: "Ngày" },
  { key: "party_name", label: "Cửa hàng" },
  { key: "item_name", label: "Hàng hóa" },
  { key: "qty", label: "SL", align: "right" },
  { key: "unit_price", label: "Đơn giá", align: "right" },
  { key: "amount", label: "Thành tiền", align: "right" },
  { key: "plant_name", label: "NM" },
  { key: "expense_code", label: "Mã chi" },
];

const DEFAULT_VISIBLE = new Set<LineSortKey>(lineColumns.map((c) => c.key));

function compareLine(a: AnalyticsLine, b: AnalyticsLine, key: LineSortKey): number {
  const av = a[key];
  const bv = b[key];
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), "vi");
}

function SortButton({
  label,
  active,
  onClick,
  align,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align?: "right";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground select-none",
        align === "right" && "text-right",
      )}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={onClick}
      >
        {label}
        <ArrowUpDown
          className={cn(
            "size-3",
            active ? "text-foreground" : "text-muted-foreground/40",
          )}
        />
      </button>
    </th>
  );
}

function renderLineCell(line: AnalyticsLine, key: LineSortKey) {
  switch (key) {
    case "payment_date":
      return (
        <td key={key} className="whitespace-nowrap px-4 py-2.5 text-xs">
          {formatViDate(line.payment_date)}
        </td>
      );
    case "party_name":
      return (
        <td
          key={key}
          className="max-w-[180px] truncate px-4 py-2.5 text-xs"
          title={line.party_name ?? undefined}
        >
          <div className="font-medium">{line.party_name ?? "—"}</div>
          {line.party_code && (
            <div className="text-[10px] text-muted-foreground">
              {line.party_code}
            </div>
          )}
        </td>
      );
    case "item_name":
      return (
        <td
          key={key}
          className="max-w-[200px] truncate px-4 py-2.5 text-xs"
          title={line.item_name ?? undefined}
        >
          <div>{line.item_name ?? "—"}</div>
          {line.uom && (
            <div className="text-[10px] text-muted-foreground">{line.uom}</div>
          )}
        </td>
      );
    case "qty":
      return (
        <td
          key={key}
          className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums"
        >
          {line.qty != null ? line.qty.toLocaleString("vi-VN") : "—"}
        </td>
      );
    case "unit_price":
      return (
        <td
          key={key}
          className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums"
        >
          {line.unit_price != null ? formatVnd(line.unit_price) : "—"}
        </td>
      );
    case "amount":
      return (
        <td
          key={key}
          className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums font-semibold"
        >
          {line.amount != null ? formatVnd(line.amount) : "—"}
        </td>
      );
    case "plant_name":
      return (
        <td key={key} className="whitespace-nowrap px-4 py-2.5">
          {line.plant_name ? (
            <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {line.plant_name}
            </span>
          ) : (
            "—"
          )}
        </td>
      );
    case "expense_code":
      return (
        <td key={key} className="whitespace-nowrap px-4 py-2.5">
          {line.expense_code ? (
            <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">
              {line.expense_code}
            </span>
          ) : (
            "—"
          )}
        </td>
      );
  }
}

export function DetailSheet(props: Props) {
  const { title, totalAmount, onClose } = props;
  const isGroups = "groups" in props && props.groups != null;
  const editable = !isGroups && props.editable !== false;
  const onGroupClick = isGroups ? props.onGroupClick : undefined;
  const selectedGroupLabel = isGroups ? props.selectedGroupLabel : null;
  const showClose = props.showClose !== false;

  const [lineSortKey, setLineSortKey] = useState<LineSortKey | null>(null);
  const [groupSortKey, setGroupSortKey] = useState<GroupSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visibleKeys, setVisibleKeys] = useState<Set<LineSortKey>>(
    () => new Set(DEFAULT_VISIBLE),
  );
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<
    { kind: "create" } | { kind: "edit"; line: AnalyticsLine } | null
  >(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLine, setDeleteLine] = useState<AnalyticsLine | null>(null);

  const visibleColumns = useMemo(
    () => lineColumns.filter((col) => visibleKeys.has(col.key)),
    [visibleKeys],
  );

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

  function handleLineSort(key: LineSortKey) {
    if (lineSortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setLineSortKey(key);
      setSortDir("asc");
    }
  }

  function handleGroupSort(key: GroupSortKey) {
    if (groupSortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setGroupSortKey(key);
      setSortDir(key === "amount" || key === "count" ? "desc" : "asc");
    }
  }

  function toggleColumn(key: LineSortKey) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const lineCountLabel = !isGroups
    ? (props.totalCount ?? props.lines?.length ?? 0)
    : 0;

  const subtitle = isGroups
    ? `${formatVnd(totalAmount)} — ${props.groups!.length.toLocaleString("vi-VN")} nhóm`
    : `${formatVnd(totalAmount)} — ${lineCountLabel.toLocaleString("vi-VN")} dòng`;

  const virtualizeGroups =
    isGroups && sortedGroups.length >= VIRTUALIZE_MIN_ROWS;
  const virtualizeLines =
    !isGroups && sortedLines.length >= VIRTUALIZE_MIN_ROWS;
  const scrollInParent = !virtualizeGroups && !virtualizeLines;

  const groupHeader = (
    <tr>
      <SortButton
        label={props.groupLabel ?? "Nhóm"}
        active={groupSortKey === "label"}
        onClick={() => handleGroupSort("label")}
      />
      <SortButton
        label="Số dòng"
        active={groupSortKey === "count"}
        onClick={() => handleGroupSort("count")}
        align="right"
      />
      <SortButton
        label="Tổng chi"
        active={groupSortKey === "amount"}
        onClick={() => handleGroupSort("amount")}
        align="right"
      />
    </tr>
  );

  const lineHeader = (
    <tr>
      {visibleColumns.map((col) => (
        <SortButton
          key={col.key}
          label={col.label}
          active={lineSortKey === col.key}
          onClick={() => handleLineSort(col.key)}
          align={col.align}
        />
      ))}
      {editable ? (
        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
          Thao tác
        </th>
      ) : null}
    </tr>
  );

  function renderLineActions(line: AnalyticsLine) {
    if (!editable) return null;
    return (
      <td className="whitespace-nowrap px-2 py-1.5 text-right">
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
      </td>
    );
  }

  function handleMutated() {
    props.onLinesChanged?.();
  }

  return (
    <Card className="motion-enter shadow-sm">
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
          {!isGroups && (
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={columnPickerOpen}
                aria-label="Chọn cột hiển thị"
                onClick={() => setColumnPickerOpen((open) => !open)}
              >
                <Columns3 className="size-4" />
              </Button>
              {columnPickerOpen && (
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border bg-popover p-3 shadow-md duration-150 data-open:animate-in">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Cột hiển thị
                  </p>
                  <ul className="grid gap-2">
                    {lineColumns.map((col) => (
                      <li key={col.key}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-3.5 accent-primary"
                            checked={visibleKeys.has(col.key)}
                            onChange={() => toggleColumn(col.key)}
                          />
                          {col.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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
      <CardContent
        className={cn(scrollInParent && "max-h-[600px] overflow-auto")}
      >
        {!isGroups && props.loading && (
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            Đang tải…
          </p>
        )}
        {!isGroups && props.error && (
          <p className="mb-3 text-sm text-destructive">{props.error}</p>
        )}
        {isGroups && props.loading && (
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            Đang tải…
          </p>
        )}
        {isGroups && props.error && (
          <p className="mb-3 text-sm text-destructive">{props.error}</p>
        )}
        {isGroups ? (
          virtualizeGroups ? (
            <TableVirtuoso
              style={{ height: VIRTUAL_TABLE_HEIGHT }}
              data={sortedGroups}
              className="text-sm"
              fixedHeaderContent={() => groupHeader}
              itemContent={(_index, group) => (
                <>
                  <td className="px-4 py-2.5 text-xs font-medium">
                    {group.label}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums">
                    {group.count.toLocaleString("vi-VN")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums font-semibold">
                    {formatVnd(group.amount)}
                  </td>
                </>
              )}
              components={{
                Table: ({ style, ...tableProps }) => (
                  <table
                    {...tableProps}
                    className="w-full text-left text-sm"
                    style={style}
                  />
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
                  const group = Number.isFinite(index)
                    ? sortedGroups[index]
                    : undefined;
                  const selected =
                    group != null && selectedGroupLabel === group.label;
                  return (
                    <tr
                      {...rowProps}
                      className={cn(
                        "hover:bg-muted/30",
                        onGroupClick && "cursor-pointer",
                        selected && "bg-primary/10",
                      )}
                      onClick={
                        onGroupClick && group
                          ? () => onGroupClick(group.label)
                          : undefined
                      }
                    />
                  );
                },
              }}
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
                {groupHeader}
              </thead>
              <tbody className="divide-y">
                {sortedGroups.map((group) => {
                  const selected = selectedGroupLabel === group.label;
                  return (
                    <tr
                      key={group.label}
                      className={cn(
                        "hover:bg-muted/30",
                        onGroupClick && "cursor-pointer",
                        selected && "bg-primary/10",
                      )}
                      onClick={
                        onGroupClick
                          ? () => onGroupClick(group.label)
                          : undefined
                      }
                    >
                      <td className="px-4 py-2.5 text-xs font-medium">
                        {group.label}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums">
                        {group.count.toLocaleString("vi-VN")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums font-semibold">
                        {formatVnd(group.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          <>
            {virtualizeLines ? (
              <TableVirtuoso
                style={{ height: VIRTUAL_TABLE_HEIGHT }}
                data={sortedLines}
                className="text-sm"
                fixedHeaderContent={() => lineHeader}
                itemContent={(_index, line) => (
                  <>
                    {visibleColumns.map((col) =>
                      renderLineCell(line, col.key),
                    )}
                    {renderLineActions(line)}
                  </>
                )}
                components={{
                  Table: ({ style, ...tableProps }) => (
                    <table
                      {...tableProps}
                      className="w-full text-left text-sm"
                      style={style}
                    />
                  ),
                  TableHead: (headProps) => (
                    <thead
                      {...headProps}
                      className="border-b bg-muted/90 backdrop-blur"
                    />
                  ),
                  TableRow: (rowProps) => (
                    <tr {...rowProps} className="hover:bg-muted/30" />
                  ),
                }}
              />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
                  {lineHeader}
                </thead>
                <tbody className="divide-y">
                  {sortedLines.map((line) => (
                    <tr key={line.id} className="hover:bg-muted/30">
                      {visibleColumns.map((col) =>
                        renderLineCell(line, col.key),
                      )}
                      {renderLineActions(line)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
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
    </Card>
  );
}
