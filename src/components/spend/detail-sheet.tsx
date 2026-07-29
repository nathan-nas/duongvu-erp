"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalyticsLine } from "./analytics-dashboard";
import { formatVnd, formatViDate } from "@/lib/spend/format";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  totalAmount: number;
  lines: AnalyticsLine[];
  onClose: () => void;
};

type SortKey =
  | "payment_date"
  | "party_name"
  | "item_name"
  | "qty"
  | "unit_price"
  | "amount"
  | "plant_name"
  | "expense_code";

type SortDir = "asc" | "desc";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "payment_date", label: "Ngày" },
  { key: "party_name", label: "Cửa hàng" },
  { key: "item_name", label: "Hàng hóa" },
  { key: "qty", label: "SL", align: "right" },
  { key: "unit_price", label: "Đơn giá", align: "right" },
  { key: "amount", label: "Thành tiền", align: "right" },
  { key: "plant_name", label: "NM" },
  { key: "expense_code", label: "Mã chi" },
];

function compare(a: AnalyticsLine, b: AnalyticsLine, key: SortKey): number {
  const av = a[key];
  const bv = b[key];
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), "vi");
}

export function DetailSheet({ title, totalAmount, lines, onClose }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedLines = useMemo(() => {
    if (!sortKey) return lines;
    const sorted = [...lines].sort((a, b) => compare(a, b, sortKey));
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [lines, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatVnd(totalAmount)} — {lines.length.toLocaleString("vi-VN")} dòng
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Đóng">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[600px]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground select-none",
                    col.align === "right" && "text-right",
                  )}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <ArrowUpDown className={cn(
                      "size-3",
                      sortKey === col.key ? "text-foreground" : "text-muted-foreground/40",
                    )} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedLines.map((line) => (
              <tr key={line.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                  {formatViDate(line.payment_date)}
                </td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-xs" title={line.party_name ?? undefined}>
                  <div className="font-medium">{line.party_name ?? "—"}</div>
                  {line.party_code && (
                    <div className="text-[10px] text-muted-foreground">{line.party_code}</div>
                  )}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-xs" title={line.item_name ?? undefined}>
                  <div>{line.item_name ?? "—"}</div>
                  {line.uom && (
                    <div className="text-[10px] text-muted-foreground">{line.uom}</div>
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
                  ) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {line.expense_code ? (
                    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">
                      {line.expense_code}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
