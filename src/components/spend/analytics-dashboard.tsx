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
import { sumBy, sumByMonth, type SpendAggregate } from "@/lib/spend/aggregations";
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

type ExpandedCard = "plant" | "expense" | "month" | null;

type DrillState =
  | {
      kind: "lines";
      title: string;
      field: "all" | "plant_name" | "expense_code" | "month";
      value: string;
      source: ExpandedCard | "kpi";
    }
  | {
      kind: "groups";
      title: string;
      groupLabel: string;
      groups: SpendAggregate[];
      source: "kpi";
    };

export function AnalyticsDashboard({
  batches,
  selectedBatchId,
  lines,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const [drill, setDrill] = useState<DrillState | null>(null);
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
  const allPlantGroups = useMemo(() => sumBy(lines, "plant_name"), [lines]);
  const allExpenseGroups = useMemo(() => sumBy(lines, "expense_code"), [lines]);

  const filteredLines = useMemo(() => {
    if (!drill || drill.kind !== "lines") return [];
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

  const openAllLines = useCallback(
    (source: ExpandedCard, title: string) => {
      if (!source) return;
      setDrill({ kind: "lines", title, field: "all", value: "", source });
      scrollToDetail();
    },
    [scrollToDetail],
  );

  const handlePlantClick = useCallback(
    (label: string) => {
      setDrill({
        kind: "lines",
        title: `NM: ${label}`,
        field: "plant_name",
        value: label,
        source: "plant",
      });
      scrollToDetail();
    },
    [scrollToDetail],
  );

  const handleExpenseClick = useCallback(
    (label: string) => {
      setDrill({
        kind: "lines",
        title: `Mã: ${label}`,
        field: "expense_code",
        value: label,
        source: "expense",
      });
      scrollToDetail();
    },
    [scrollToDetail],
  );

  const handleMonthClick = useCallback(
    (label: string) => {
      setDrill({
        kind: "lines",
        title: `Tháng: ${label}`,
        field: "month",
        value: label,
        source: "month",
      });
      scrollToDetail();
    },
    [scrollToDetail],
  );

  const handleClose = useCallback(() => setDrill(null), []);

  function toggleExpand(card: NonNullable<ExpandedCard>, title: string) {
    if (expanded === card) {
      setExpanded(null);
      setDrill((d) => (d && d.source === card ? null : d));
      return;
    }
    setExpanded(card);
    openAllLines(card, title);
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
  const plantCount = allPlantGroups.length;
  const expenseCodeCount = allExpenseGroups.length;

  const kpis = [
    {
      label: "Tổng chi",
      value: formatVnd(totalAmount),
      onClick: () => {
        setDrill({
          kind: "lines",
          title: "Tất cả dòng chi",
          field: "all",
          value: "",
          source: "kpi",
        });
        scrollToDetail();
      },
    },
    {
      label: "Số nhà máy",
      value: String(plantCount),
      onClick: () => {
        setDrill({
          kind: "groups",
          title: "Tổng hợp theo nhà máy",
          groupLabel: "Nhà máy",
          groups: allPlantGroups,
          source: "kpi",
        });
        scrollToDetail();
      },
    },
    {
      label: "Số mã chi",
      value: String(expenseCodeCount),
      onClick: () => {
        setDrill({
          kind: "groups",
          title: "Tổng hợp theo mã chi",
          groupLabel: "Mã chi",
          groups: allExpenseGroups,
          source: "kpi",
        });
        scrollToDetail();
      },
    },
  ];

  const showPlant = expanded === null || expanded === "plant";
  const showExpense = expanded === null || expanded === "expense";
  const showMonth = expanded === null || expanded === "month";

  function renderDetail(source: DrillState["source"]) {
    if (!drill || drill.source !== source) return null;
    return (
      <div ref={detailRef}>
        {drill.kind === "groups" ? (
          <DetailSheet
            title={drill.title}
            totalAmount={drill.groups.reduce((s, g) => s + g.amount, 0)}
            groups={drill.groups}
            groupLabel={drill.groupLabel}
            onClose={handleClose}
          />
        ) : (
          <DetailSheet
            title={drill.title}
            totalAmount={filteredTotal}
            lines={filteredLines}
            onClose={handleClose}
          />
        )}
      </div>
    );
  }

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

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Chỉ số tổng quan">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
            onClick={kpi.onClick}
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

      {renderDetail("kpi")}

      <section className={cn("grid gap-6", expanded === null && "lg:grid-cols-2")}>
        {showPlant && (
          <Card
            className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
            onClick={() => openAllLines("plant", "Chi theo nhà máy")}
          >
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Chi theo nhà máy (NM)</CardTitle>
                <p className="text-xs text-muted-foreground">Nhấn biểu đồ để lọc chi tiết</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand("plant", "Chi theo nhà máy");
                }}
                aria-label={expanded === "plant" ? "Thu nhỏ" : "Phóng to"}
              >
                {expanded === "plant" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </CardHeader>
            <CardContent
              onClick={(e) => e.stopPropagation()}
            >
              <SpendTreemap data={plantData} onClickBlock={handlePlantClick} />
            </CardContent>
          </Card>
        )}
        {showExpense && (
          <Card
            className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
            onClick={() => openAllLines("expense", "Chi theo mã chi phí")}
          >
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Chi theo mã chi phí (MÃ)</CardTitle>
                <p className="text-xs text-muted-foreground">Nhấn biểu đồ để lọc chi tiết</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand("expense", "Chi theo mã chi phí");
                }}
                aria-label={expanded === "expense" ? "Thu nhỏ" : "Phóng to"}
              >
                {expanded === "expense" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </CardHeader>
            <CardContent onClick={(e) => e.stopPropagation()}>
              <SpendTreemap data={expenseData} onClickBlock={handleExpenseClick} />
            </CardContent>
          </Card>
        )}
      </section>

      {renderDetail("plant")}
      {renderDetail("expense")}

      {showMonth && (
        <Card
          className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
          onClick={() => openAllLines("month", "Xu hướng chi theo tháng")}
        >
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Xu hướng chi theo tháng</CardTitle>
              <p className="text-xs text-muted-foreground">Nhấn điểm để lọc chi tiết tháng</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand("month", "Xu hướng chi theo tháng");
              }}
              aria-label={expanded === "month" ? "Thu nhỏ" : "Phóng to"}
            >
              {expanded === "month" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </CardHeader>
          <CardContent onClick={(e) => e.stopPropagation()}>
            <SpendAreaChart data={monthData} onClickPoint={handleMonthClick} />
          </CardContent>
        </Card>
      )}

      {renderDetail("month")}
    </div>
  );
}
