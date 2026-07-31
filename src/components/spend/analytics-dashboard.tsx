"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  fetchSpendLinesPage,
  type AnalyticsLine,
  type SpendFilterKind,
} from "@/api/analytics";
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
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { formatImportBatchLabel } from "@/lib/spend/batch-label";
import { SPEND_LINES_PAGE_SIZE } from "@/lib/spend/constants";
import { formatVnd } from "@/lib/spend/format";
import { SpendTreemap } from "./spend-treemap";
import { SpendAreaChart } from "./spend-area-chart";
import { DetailSheet } from "./detail-sheet";
import { cn } from "@/lib/utils";

const DETAIL_ANCHOR_ID = "spend-detail-panel";

function scrollToDetail() {
  setTimeout(() => {
    document
      .getElementById(DETAIL_ANCHOR_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

export type AnalyticsBatch = {
  id: string;
  source_filename: string;
  period_year: number;
  batch_kind: "annual" | "period" | "unknown";
  fact_rows: number;
  amount_sum: number;
};

export type { AnalyticsLine };

type AnalyticsDashboardProps = {
  batches: AnalyticsBatch[];
  selectedBatchId: string | null;
  plantData: SpendAggregate[];
  expenseData: SpendAggregate[];
  monthData: SpendAggregate[];
  plantAll: SpendAggregate[];
  expenseAll: SpendAggregate[];
};

type ExpandedCard = "plant" | "expense" | "month" | null;

type DrillState =
  | {
      kind: "lines";
      title: string;
      field: SpendFilterKind;
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
  plantData,
  expenseData,
  monthData,
  plantAll,
  expenseAll,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const [pageLines, setPageLines] = useState<AnalyticsLine[]>([]);
  const [pageTotalCount, setPageTotalCount] = useState(0);
  const [pageTotalAmount, setPageTotalAmount] = useState(0);
  const [pageOffset, setPageOffset] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const batchLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    const counts = new Map<string, number>();
    for (const b of batches) {
      const base = formatImportBatchLabel(b);
      counts.set(base, (counts.get(base) ?? 0) + 1);
    }
    const seen = new Map<string, number>();
    for (const b of batches) {
      const base = formatImportBatchLabel(b);
      if ((counts.get(base) ?? 0) <= 1) {
        map.set(b.id, base);
        continue;
      }
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      map.set(b.id, `${base} (${n})`);
    }
    return map;
  }, [batches]);

  const loadLinesPage = useCallback(
    async (field: SpendFilterKind, value: string, offset: number) => {
      if (!selectedBatchId) return;
      setPageLoading(true);
      setPageError(null);
      const result = await fetchSpendLinesPage({
        batchId: selectedBatchId,
        filterKind: field,
        filterValue: value,
        offset,
        limit: SPEND_LINES_PAGE_SIZE,
      });
      setPageLoading(false);
      if ("error" in result) {
        setPageError(result.error);
        setPageLines([]);
        setPageTotalCount(0);
        setPageTotalAmount(0);
        return;
      }
      setPageLines(result.lines);
      setPageTotalCount(result.totalCount);
      setPageTotalAmount(result.totalAmount);
      setPageOffset(offset);
    },
    [selectedBatchId],
  );

  const openLinesDrill = useCallback(
    (next: Extract<DrillState, { kind: "lines" }>) => {
      setDrill(next);
      void loadLinesPage(next.field, next.value, 0);
      scrollToDetail();
    },
    [loadLinesPage],
  );

  const openAllLines = useCallback(
    (source: ExpandedCard, title: string) => {
      if (!source) return;
      openLinesDrill({
        kind: "lines",
        title,
        field: "all",
        value: "",
        source,
      });
    },
    [openLinesDrill],
  );

  const handlePlantClick = useCallback(
    (label: string) => {
      openLinesDrill({
        kind: "lines",
        title: `NM: ${label}`,
        field: "plant_name",
        value: label,
        source: "plant",
      });
    },
    [openLinesDrill],
  );

  const handleExpenseClick = useCallback(
    (label: string) => {
      openLinesDrill({
        kind: "lines",
        title: `Mã: ${label}`,
        field: "expense_code",
        value: label,
        source: "expense",
      });
    },
    [openLinesDrill],
  );

  const handleMonthClick = useCallback(
    (label: string) => {
      openLinesDrill({
        kind: "lines",
        title: `Tháng: ${label}`,
        field: "month",
        value: label,
        source: "month",
      });
    },
    [openLinesDrill],
  );

  const handleClose = useCallback(() => {
    setDrill(null);
    setPageLines([]);
    setPageTotalCount(0);
    setPageTotalAmount(0);
    setPageOffset(0);
    setPageError(null);
  }, []);

  function toggleExpand(card: NonNullable<ExpandedCard>, title: string) {
    if (expanded === card) {
      setExpanded(null);
      if (drill && drill.source === card) {
        handleClose();
      }
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
  const plantCount = plantAll.length;
  const expenseCodeCount = expenseAll.length;

  const kpis = [
    {
      label: "Tổng chi",
      value: formatVnd(totalAmount),
      onClick: () => {
        openLinesDrill({
          kind: "lines",
          title: "Tất cả dòng chi",
          field: "all",
          value: "",
          source: "kpi",
        });
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
          groups: plantAll,
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
          groups: expenseAll,
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
      <div id={DETAIL_ANCHOR_ID}>
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
            totalAmount={pageTotalAmount}
            lines={pageLines}
            totalCount={pageTotalCount}
            loading={pageLoading}
            error={pageError}
            pageOffset={pageOffset}
            pageSize={SPEND_LINES_PAGE_SIZE}
            onPrevPage={() => {
              const next = Math.max(0, pageOffset - SPEND_LINES_PAGE_SIZE);
              void loadLinesPage(drill.field, drill.value, next);
            }}
            onNextPage={() => {
              const next = pageOffset + SPEND_LINES_PAGE_SIZE;
              if (next < pageTotalCount) {
                void loadLinesPage(drill.field, drill.value, next);
              }
            }}
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
              onValueChange={(val) =>
                router.push(`/app/analytics?batch=${val}`)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn lô dữ liệu">
                  {selectedBatchId
                    ? batchLabelMap.get(selectedBatchId)
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batchLabelMap.get(batch.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Chỉ số tổng quan"
      >
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
            onClick={kpi.onClick}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {renderDetail("kpi")}

      <section
        className={cn("grid gap-6", expanded === null && "lg:grid-cols-2")}
      >
        {showPlant && (
          <Card
            className="cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/30"
            onClick={() => openAllLines("plant", "Chi theo nhà máy")}
          >
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  Chi theo nhà máy (NM)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Nhấn biểu đồ để lọc chi tiết
                </p>
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
                {expanded === "plant" ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent onClick={(e) => e.stopPropagation()}>
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
                <CardTitle className="text-base">
                  Chi theo mã chi phí (MÃ)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Nhấn biểu đồ để lọc chi tiết
                </p>
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
                {expanded === "expense" ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent onClick={(e) => e.stopPropagation()}>
              <SpendTreemap
                data={expenseData}
                onClickBlock={handleExpenseClick}
              />
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
              <CardTitle className="text-base">
                Xu hướng chi theo tháng
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Nhấn điểm để lọc chi tiết tháng
              </p>
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
              {expanded === "month" ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
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
