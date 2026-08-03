"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { BarChart3, Maximize2, Minimize2 } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";
import { isIsoDate } from "@/lib/spend/date-range";
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

export type { AnalyticsLine };

type AnalyticsDashboardProps = {
  from: string | null;
  to: string | null;
  boundsMin: string | null;
  boundsMax: string | null;
  rangeError: string | null;
  amountSum: number;
  plantData: SpendAggregate[];
  expenseData: SpendAggregate[];
  partyData: SpendAggregate[];
  monthData: SpendAggregate[];
  plantAll: SpendAggregate[];
  expenseAll: SpendAggregate[];
};

type ExpandedCard = "plant" | "expense" | "party" | "month" | null;

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
  from,
  to,
  boundsMin,
  boundsMax,
  rangeError,
  amountSum,
  plantData,
  expenseData,
  partyData,
  monthData,
  plantAll,
  expenseAll,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const [fromInput, setFromInput] = useState(from ?? boundsMin ?? "");
  const [toInput, setToInput] = useState(to ?? boundsMax ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const [pageLines, setPageLines] = useState<AnalyticsLine[]>([]);
  const [pageTotalCount, setPageTotalCount] = useState(0);
  const [pageTotalAmount, setPageTotalAmount] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageLoadingMore, setPageLoadingMore] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const hasRange = Boolean(from && to && !rangeError);

  const loadLines = useCallback(
    async (field: SpendFilterKind, value: string, offset = 0, append = false) => {
      if (!from || !to) return;
      if (append) setPageLoadingMore(true);
      else {
        setPageLoading(true);
        setPageError(null);
      }
      const result = await fetchSpendLinesPage({
        from,
        to,
        filterKind: field,
        filterValue: value,
        offset,
        limit: SPEND_LINE_CHUNK,
      });
      if (append) setPageLoadingMore(false);
      else setPageLoading(false);
      if ("error" in result) {
        setPageError(result.error);
        if (!append) {
          setPageLines([]);
          setPageTotalCount(0);
          setPageTotalAmount(0);
        }
        return;
      }
      setPageTotalCount(result.totalCount);
      setPageTotalAmount(result.totalAmount);
      setPageLines((prev) =>
        append ? [...prev, ...result.lines] : result.lines,
      );
    },
    [from, to],
  );

  const openLinesDrill = useCallback(
    (next: Extract<DrillState, { kind: "lines" }>) => {
      setDrill(next);
      void loadLines(next.field, next.value, 0, false);
      scrollToDetail();
    },
    [loadLines],
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

  const handlePartyClick = useCallback(
    (label: string) => {
      openLinesDrill({
        kind: "lines",
        title: `Đối tác: ${label}`,
        field: "party",
        value: label,
        source: "party",
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

  function applyRange() {
    setFormError(null);
    if (!isIsoDate(fromInput) || !isIsoDate(toInput)) {
      setFormError("Vui lòng chọn đủ ngày bắt đầu và kết thúc.");
      return;
    }
    if (fromInput > toInput) {
      setFormError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    handleClose();
    router.push(`/app/analytics?from=${fromInput}&to=${toInput}`);
  }

  if (!boundsMin || !boundsMax) {
    return (
      <Card className="motion-enter">
        <CardHeader>
          <CardTitle>Chưa có dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <BarChart3
            className="size-10 text-muted-foreground empty-float"
            aria-hidden
          />
          <p>Chưa có dữ liệu. Hãy tải lên file Excel.</p>
          <Button render={<Link href="/app/uploads" />}>Tải lên file</Button>
        </CardContent>
      </Card>
    );
  }

  const plantCount = plantAll.length;
  const expenseCodeCount = expenseAll.length;

  const kpis = [
    {
      label: "Tổng chi",
      value: (
        <NumberFlow
          value={amountSum}
          locales="vi-VN"
          format={{
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          }}
        />
      ),
      onClick: () => {
        if (!hasRange) return;
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
      value: <NumberFlow value={plantCount} locales="vi-VN" />,
      onClick: () => {
        if (!hasRange) return;
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
      value: <NumberFlow value={expenseCodeCount} locales="vi-VN" />,
      onClick: () => {
        if (!hasRange) return;
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
  const showParty = expanded === null || expanded === "party";
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
          <>
            <DetailSheet
              title={drill.title}
              totalAmount={pageTotalAmount}
              lines={pageLines}
              totalCount={pageTotalCount}
              loading={pageLoading}
              error={pageError}
              editable
              onLinesChanged={() => {
                void loadLines(drill.field, drill.value, 0, false);
              }}
              onClose={handleClose}
            />
            {pageLines.length < pageTotalCount && !pageLoading && !pageError ? (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pageLoadingMore}
                  onClick={() =>
                    void loadLines(
                      drill.field,
                      drill.value,
                      pageLines.length,
                      true,
                    )
                  }
                >
                  {pageLoadingMore
                    ? "Đang tải thêm…"
                    : `Tải thêm (${pageLines.length.toLocaleString("vi-VN")} / ${pageTotalCount.toLocaleString("vi-VN")})`}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm">
        <CardContent className="grid gap-4 pt-4">
          <p className="text-sm font-medium">Kỳ giao dịch</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="analytics-from">Từ ngày</Label>
              <DatePicker
                id="analytics-from"
                value={fromInput}
                min={boundsMin}
                max={boundsMax}
                onChange={setFromInput}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="analytics-to">Đến ngày</Label>
              <DatePicker
                id="analytics-to"
                value={toInput}
                min={boundsMin}
                max={boundsMax}
                onChange={setToInput}
              />
            </div>
            <Button type="button" onClick={applyRange}>
              Áp dụng
            </Button>
          </div>
          {(formError || rangeError) && (
            <p className="text-sm text-destructive">{formError ?? rangeError}</p>
          )}
        </CardContent>
      </Card>

      {!hasRange ? null : (
        <>
          <section
            className="grid gap-4 sm:grid-cols-3"
            aria-label="Chỉ số tổng quan"
          >
            {kpis.map((kpi) => (
              <Card
                key={kpi.label}
                className="pressable-card cursor-pointer shadow-sm"
                onClick={kpi.onClick}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
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
                className="pressable-card cursor-pointer shadow-sm"
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
                  <SpendTreemap
                    data={plantData}
                    onClickBlock={handlePlantClick}
                  />
                </CardContent>
              </Card>
            )}
            {showExpense && (
              <Card
                className="pressable-card cursor-pointer shadow-sm"
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
                    aria-label={
                      expanded === "expense" ? "Thu nhỏ" : "Phóng to"
                    }
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

          {showParty && (
            <Card
              className="pressable-card cursor-pointer shadow-sm"
              onClick={() => openAllLines("party", "Chi theo đối tác")}
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    Chi theo đối tác (ĐT)
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
                    toggleExpand("party", "Chi theo đối tác");
                  }}
                  aria-label={expanded === "party" ? "Thu nhỏ" : "Phóng to"}
                >
                  {expanded === "party" ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent onClick={(e) => e.stopPropagation()}>
                <SpendTreemap
                  data={partyData}
                  onClickBlock={handlePartyClick}
                />
              </CardContent>
            </Card>
          )}

          {renderDetail("party")}

          {showMonth && (
            <Card
              className="pressable-card cursor-pointer shadow-sm"
              onClick={() =>
                openAllLines("month", "Xu hướng chi theo tháng")
              }
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
                <SpendAreaChart
                  data={monthData}
                  onClickPoint={handleMonthClick}
                />
              </CardContent>
            </Card>
          )}

          {renderDetail("month")}
        </>
      )}
    </div>
  );
}
