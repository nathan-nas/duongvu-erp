"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalyticsLine } from "@/app/app/actions/analytics";
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { formatVnd, formatViDate } from "@/lib/spend/format";
import { cn } from "@/lib/utils";

type LinesProps = {
  title: string;
  totalAmount: number;
  lines: AnalyticsLine[];
  totalCount?: number;
  loading?: boolean;
  error?: string | null;
  pageOffset?: number;
  pageSize?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  groups?: never;
  groupLabel?: never;
  onClose: () => void;
};

type GroupsProps = {
  title: string;
  totalAmount: number;
  groups: SpendAggregate[];
  groupLabel: string;
  lines?: never;
  totalCount?: never;
  loading?: never;
  error?: never;
  pageOffset?: never;
  pageSize?: never;
  onPrevPage?: never;
  onNextPage?: never;
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

export function DetailSheet(props: Props) {
  const { title, totalAmount, onClose } = props;
  const isGroups = "groups" in props && props.groups != null;

  const [lineSortKey, setLineSortKey] = useState<LineSortKey | null>(null);
  const [groupSortKey, setGroupSortKey] = useState<GroupSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  const lineCountLabel = !isGroups
    ? (props.totalCount ?? props.lines?.length ?? 0)
    : 0;

  const subtitle = isGroups
    ? `${formatVnd(totalAmount)} — ${props.groups!.length.toLocaleString("vi-VN")} nhóm`
    : `${formatVnd(totalAmount)} — ${lineCountLabel.toLocaleString("vi-VN")} dòng`;

  const pageOffset = !isGroups ? (props.pageOffset ?? 0) : 0;
  const pageSize = !isGroups ? (props.pageSize ?? 50) : 50;
  const totalCount = !isGroups ? (props.totalCount ?? props.lines?.length ?? 0) : 0;
  const showPaging =
    !isGroups &&
    typeof props.onPrevPage === "function" &&
    typeof props.onNextPage === "function" &&
    totalCount > pageSize;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Đóng">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[600px]">
        {!isGroups && props.loading && (
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            Đang tải…
          </p>
        )}
        {!isGroups && props.error && (
          <p className="mb-3 text-sm text-destructive">{props.error}</p>
        )}
        {isGroups ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
              <tr>
                <SortButton
                  label={props.groupLabel!}
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
            </thead>
            <tbody className="divide-y">
              {sortedGroups.map((group) => (
                <tr key={group.label} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs font-medium">{group.label}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums">
                    {group.count.toLocaleString("vi-VN")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums font-semibold">
                    {formatVnd(group.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
                <tr>
                  {lineColumns.map((col) => (
                    <SortButton
                      key={col.key}
                      label={col.label}
                      active={lineSortKey === col.key}
                      onClick={() => handleLineSort(col.key)}
                      align={col.align}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedLines.map((line) => (
                  <tr key={line.id} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                      {formatViDate(line.payment_date)}
                    </td>
                    <td
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
                    <td
                      className="max-w-[200px] truncate px-4 py-2.5 text-xs"
                      title={line.item_name ?? undefined}
                    >
                      <div>{line.item_name ?? "—"}</div>
                      {line.uom && (
                        <div className="text-[10px] text-muted-foreground">
                          {line.uom}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums">
                      {line.qty != null ? line.qty.toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums">
                      {line.unit_price != null ? formatVnd(line.unit_price) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-right tabular-nums font-semibold">
                      {line.amount != null ? formatVnd(line.amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {line.plant_name ? (
                        <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {line.plant_name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {line.expense_code ? (
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">
                          {line.expense_code}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {showPaging && (
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {pageOffset + 1}–
                  {Math.min(pageOffset + pageSize, totalCount)} /{" "}
                  {totalCount.toLocaleString("vi-VN")}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pageOffset <= 0 || props.loading}
                    onClick={props.onPrevPage}
                  >
                    Trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      pageOffset + pageSize >= totalCount || props.loading
                    }
                    onClick={props.onNextPage}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
