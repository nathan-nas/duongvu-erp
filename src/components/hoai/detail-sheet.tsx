"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsLine } from "./analytics-dashboard";
import { formatVnd, formatViDate } from "@/lib/hoai/format";

type Props = {
  open: boolean;
  title: string;
  totalAmount: number;
  lines: AnalyticsLine[];
  onClose: () => void;
};

export function DetailSheet({ open, title, totalAmount, lines, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l bg-background shadow-xl animate-in slide-in-from-right"
        role="dialog"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {formatVnd(totalAmount)} — {lines.length.toLocaleString("vi-VN")} dòng
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground">Ngày</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground">Cửa hàng</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground">Hàng hóa</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground text-right">SL</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Đơn giá</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Thành tiền</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground">NM</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground">Mã chi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map((line) => (
                <tr key={line.id} className="hover:bg-muted/30 transition-colors">
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
        </div>
      </div>
    </>
  );
}
