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
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l bg-background shadow-xl animate-in slide-in-from-right"
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
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b bg-muted/80 backdrop-blur">
              <tr>
                {["Ngày", "MÃ KH", "Cửa hàng", "Hàng", "ĐVT", "SL", "Đ.Giá", "T.Tiền", "NM", "MÃ", "TT"].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-xs font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">{formatViDate(line.payment_date)}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">{line.party_code ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-3 py-1.5 text-xs">{line.party_name ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-3 py-1.5 text-xs">{line.item_name ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">{line.uom ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">
                    {line.qty != null ? line.qty.toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">
                    {line.unit_price != null ? formatVnd(line.unit_price) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs font-medium">
                    {line.amount != null ? formatVnd(line.amount) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">{line.plant_name ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">{line.expense_code ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs">{line.payment_method ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
