"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sumBy, sumByMonth } from "@/lib/hoai/aggregations";
import { formatVnd } from "@/lib/hoai/format";
import { SpendTreemap } from "./spend-treemap";
import { SpendAreaChart } from "./spend-area-chart";
import { DetailSheet } from "./detail-sheet";

export type AnalyticsBatch = {
  id: string;
  source_filename: string;
  period_year: number;
  batch_kind: "annual" | "period" | "unknown";
};

export type AnalyticsLine = {
  id: string;
  payment_date: string | null;
  party_code: string | null;
  party_name: string | null;
  item_code: string | null;
  item_name: string | null;
  uom: string | null;
  qty: number | null;
  unit_price: number | null;
  amount: number | null;
  plant_name: string | null;
  expense_code: string | null;
  payment_method: string | null;
  description: string | null;
  invoice: string | null;
  note: string | null;
};

type AnalyticsDashboardProps = {
  batches: AnalyticsBatch[];
  selectedBatchId: string | null;
  lines: AnalyticsLine[];
};

const batchKindLabel = {
  annual: "Cả năm",
  period: "Theo kỳ",
  unknown: "Không xác định",
};

type DrillState = {
  field: "plant_name" | "expense_code" | "month";
  value: string;
} | null;

export function AnalyticsDashboard({
  batches,
  selectedBatchId,
  lines,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const [drill, setDrill] = useState<DrillState>(null);

  const plantData = useMemo(() => sumBy(lines, "plant_name", 15), [lines]);
  const expenseData = useMemo(() => sumBy(lines, "expense_code", 15), [lines]);
  const monthData = useMemo(() => sumByMonth(lines), [lines]);

  const filteredLines = useMemo(() => {
    if (!drill) return [];
    if (drill.field === "month") {
      return lines.filter((l) => l.payment_date?.startsWith(drill.value));
    }
    if (drill.field === "plant_name") {
      return lines.filter((l) => l.plant_name === drill.value);
    }
    return lines.filter((l) => l.expense_code === drill.value);
  }, [lines, drill]);

  const filteredTotal = useMemo(
    () => filteredLines.reduce((s, l) => s + (l.amount ?? 0), 0),
    [filteredLines],
  );

  const handlePlantClick = useCallback((label: string) => {
    setDrill({ field: "plant_name", value: label });
  }, []);

  const handleExpenseClick = useCallback((label: string) => {
    setDrill({ field: "expense_code", value: label });
  }, []);

  const handleMonthClick = useCallback((label: string) => {
    setDrill({ field: "month", value: label });
  }, []);

  const handleClose = useCallback(() => setDrill(null), []);

  if (batches.length === 0 || !selectedBatchId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p>Chưa có dữ liệu. Hãy tải lên file Excel.</p>
          <Button render={<Link href="/app/uploads" />}>Tải lên file</Button>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = lines.reduce((t, l) => t + (l.amount ?? 0), 0);
  const plantCount = new Set(lines.map((l) => l.plant_name?.trim()).filter(Boolean)).size;
  const expenseCodeCount = new Set(lines.map((l) => l.expense_code?.trim()).filter(Boolean)).size;

  const cards = [
    { label: "Tổng chi", value: formatVnd(totalAmount) },
    { label: "Số dòng", value: new Intl.NumberFormat("vi-VN").format(lines.length) },
    { label: "Số nhà máy", value: String(plantCount) },
    { label: "Số mã chi", value: String(expenseCodeCount) },
  ];

  const drillTitle = drill
    ? drill.field === "plant_name"
      ? `NM: ${drill.value}`
      : drill.field === "expense_code"
        ? `Mã: ${drill.value}`
        : `Tháng: ${drill.value}`
    : "";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-4">
          <div className="grid max-w-xl gap-2 text-sm font-medium">
            <span>Lô dữ liệu</span>
            <Select
              value={selectedBatchId}
              onValueChange={(val) => router.push(`/app/analytics?batch=${val}`)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.source_filename} — {batch.period_year} ({batchKindLabel[batch.batch_kind]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Chỉ số tổng quan">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chi theo nhà máy (NM)</CardTitle>
            <p className="text-xs text-muted-foreground">Nhấn vào ô để xem chi tiết</p>
          </CardHeader>
          <CardContent>
            <SpendTreemap data={plantData} onClickBlock={handlePlantClick} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chi theo mã chi phí (MÃ)</CardTitle>
            <p className="text-xs text-muted-foreground">Nhấn vào ô để xem chi tiết</p>
          </CardHeader>
          <CardContent>
            <SpendTreemap data={expenseData} onClickBlock={handleExpenseClick} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Xu hướng chi theo tháng</CardTitle>
          <p className="text-xs text-muted-foreground">Nhấn vào điểm để xem chi tiết tháng</p>
        </CardHeader>
        <CardContent>
          <SpendAreaChart data={monthData} onClickPoint={handleMonthClick} />
        </CardContent>
      </Card>

      <DetailSheet
        open={drill !== null}
        title={drillTitle}
        totalAmount={filteredTotal}
        lines={filteredLines}
        onClose={handleClose}
      />
    </div>
  );
}
