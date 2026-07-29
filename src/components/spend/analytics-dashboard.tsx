"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
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
import { sumBy, sumByMonth } from "@/lib/spend/aggregations";
import { formatVnd } from "@/lib/spend/format";
import { SpendTreemap } from "./spend-treemap";
import { SpendAreaChart } from "./spend-area-chart";
import { DetailSheet } from "./detail-sheet";
import { cn } from "@/lib/utils";

export type AnalyticsBatch = {
  id: string;
  source_filename: string;
  period_year: number;
  batch_kind: "annual" | "period" | "unknown";
  fact_rows: number;
  amount_sum: number;
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

type DrillField = "plant_name" | "expense_code" | "month" | "all";

type DrillState = {
  field: DrillField;
  value: string;
  source: ExpandedCard | "kpi";
} | null;

type ExpandedCard = "plant" | "expense" | "month" | null;

export function AnalyticsDashboard({
  batches,
  selectedBatchId,
  lines,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const [drill, setDrill] = useState<DrillState>(null);
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const batchLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of batches) {
      map.set(b.id, `${b.source_filename} — ${b.period_year} (${batchKindLabel[b.batch_kind]})`);
    }
    return map;
  }, [batches]);

  const plantData = useMemo(() => sumBy(lines, "plant_name", 15), [lines]);
  const expenseData = useMemo(() => sumBy(lines, "expense_code", 15), [lines]);
  const monthData = useMemo(() => sumByMonth(lines), [lines]);

  const filteredLines = useMemo(() => {
    if (!drill) return [];
    if (drill.field === "all") return lines;
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

  const scrollToDetail = useCallback(() => {
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const handlePlantClick = useCallback((label: string) => {
    setDrill({ field: "plant_name", value: label, source: "plant" });
    scrollToDetail();
  }, [scrollToDetail]);

  const handleExpenseClick = useCallback((label: string) => {
    setDrill({ field: "expense_code", value: label, source: "expense" });
    scrollToDetail();
  }, [scrollToDetail]);

  const handleMonthClick = useCallback((label: string) => {
    setDrill({ field: "month", value: label, source: "month" });
    scrollToDetail();
  }, [scrollToDetail]);

  const handleClose = useCallback(() => setDrill(null), []);

  function toggleExpand(card: ExpandedCard) {
    setExpanded((prev) => (prev === card ? null : card));
  }

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

  const selectedBatch = batches.find((b) => b.id === selectedBatchId)!;
  const totalAmount = selectedBatch.amount_sum;
  const factRows = selectedBatch.fact_rows;
  const plantCount = new Set(lines.map((l) => l.plant_name?.trim()).filter(Boolean)).size;
  const expenseCodeCount = new Set(lines.map((l) => l.expense_code?.trim()).filter(Boolean)).size;

  type KpiDef = { label: string; value: string; drillField: DrillField; drillValue: string; drillLabel: string };
  const kpis: KpiDef[] = [
    { label: "Tổng chi", value: formatVnd(totalAmount), drillField: "all", drillValue: "", drillLabel: "Tất cả dòng chi" },
    { label: "Số dòng", value: new Intl.NumberFormat("vi-VN").format(factRows), drillField: "all", drillValue: "", drillLabel: "Tất cả dòng chi" },
    { label: "Số nhà máy", value: String(plantCount), drillField: "all", drillValue: "", drillLabel: "Tất cả nhà máy" },
    { label: "Số mã chi", value: String(expenseCodeCount), drillField: "all", drillValue: "", drillLabel: "Tất cả mã chi" },
  ];

  const drillTitle = drill
    ? drill.field === "all"
      ? drill.value || "Tất cả dòng chi"
      : drill.field === "plant_name"
        ? `NM: ${drill.value}`
        : drill.field === "expense_code"
          ? `Mã: ${drill.value}`
          : `Tháng: ${drill.value}`
    : "";

  const showPlant = expanded === null || expanded === "plant";
  const showExpense = expanded === null || expanded === "expense";
  const showMonth = expanded === null || expanded === "month";

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <div className="grid max-w-xl gap-2 text-sm font-medium">
            <span>Lô dữ liệu</span>
            <Select
              value={selectedBatchId}
              onValueChange={(val) => router.push(`/app/analytics?batch=${val}`)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn lô dữ liệu">
                  {selectedBatchId ? batchLabelMap.get(selectedBatchId) : null}
                </SelectValue>
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
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
            onClick={() => {
              setDrill({ field: kpi.drillField, value: kpi.drillLabel, source: "kpi" });
              scrollToDetail();
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {drill && drill.source === "kpi" && (
        <div ref={detailRef}>
          <DetailSheet
            title={drillTitle}
            totalAmount={filteredTotal}
            lines={filteredLines}
            onClose={handleClose}
          />
        </div>
      )}

      <section className={cn("grid gap-6", expanded === null && "lg:grid-cols-2")}>
        {showPlant && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Chi theo nhà máy (NM)</CardTitle>
                <p className="text-xs text-muted-foreground">Nhấn ô để xem chi tiết</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand("plant")}
                aria-label={expanded === "plant" ? "Thu nhỏ" : "Phóng to"}
              >
                {expanded === "plant" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <SpendTreemap data={plantData} onClickBlock={handlePlantClick} />
            </CardContent>
          </Card>
        )}
        {showExpense && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Chi theo mã chi phí (MÃ)</CardTitle>
                <p className="text-xs text-muted-foreground">Nhấn ô để xem chi tiết</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand("expense")}
                aria-label={expanded === "expense" ? "Thu nhỏ" : "Phóng to"}
              >
                {expanded === "expense" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <SpendTreemap data={expenseData} onClickBlock={handleExpenseClick} />
            </CardContent>
          </Card>
        )}
      </section>

      {drill && (drill.source === "plant" || drill.source === "expense") && (
        <div ref={detailRef}>
          <DetailSheet
            title={drillTitle}
            totalAmount={filteredTotal}
            lines={filteredLines}
            onClose={handleClose}
          />
        </div>
      )}

      {showMonth && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Xu hướng chi theo tháng</CardTitle>
              <p className="text-xs text-muted-foreground">Nhấn điểm để xem chi tiết tháng</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand("month")}
              aria-label={expanded === "month" ? "Thu nhỏ" : "Phóng to"}
            >
              {expanded === "month" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <SpendAreaChart data={monthData} onClickPoint={handleMonthClick} />
          </CardContent>
        </Card>
      )}

      {drill && drill.source === "month" && (
        <div ref={detailRef}>
          <DetailSheet
            title={drillTitle}
            totalAmount={filteredTotal}
            lines={filteredLines}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
