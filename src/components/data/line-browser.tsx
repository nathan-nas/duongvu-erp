"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchSpendLinesPage,
  type AnalyticsLine,
} from "@/api/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";
import { isIsoDate } from "@/lib/spend/date-range";
import { DetailSheet } from "@/components/spend/detail-sheet";

type Props = {
  boundsMin: string | null;
  boundsMax: string | null;
};

export function LineBrowser({ boundsMin, boundsMax }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(boundsMin ?? "");
  const [to, setTo] = useState(boundsMax ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [lines, setLines] = useState<AnalyticsLine[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadPage = useCallback(
    async (rangeFrom: string, rangeTo: string, offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }

      const result = await fetchSpendLinesPage({
        from: rangeFrom,
        to: rangeTo,
        filterKind: "all",
        filterValue: "",
        offset,
        limit: SPEND_LINE_CHUNK,
      });

      if (append) setLoadingMore(false);
      else setLoading(false);

      if ("error" in result) {
        setError(result.error);
        if (!append) {
          setLines([]);
          setTotalCount(0);
          setTotalAmount(0);
        }
        return;
      }

      setTotalCount(result.totalCount);
      setTotalAmount(result.totalAmount);
      setLines((prev) => (append ? [...prev, ...result.lines] : result.lines));
      setLoaded(true);
    },
    [],
  );

  function apply() {
    setFormError(null);
    if (!isIsoDate(from) || !isIsoDate(to)) {
      setFormError("Vui lòng chọn đủ ngày bắt đầu và kết thúc.");
      return;
    }
    if (from > to) {
      setFormError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    void loadPage(from, to, 0, false);
  }

  function handleMutated() {
    if (isIsoDate(from) && isIsoDate(to)) {
      void loadPage(from, to, 0, false);
    }
    router.refresh();
  }

  const hasMore = lines.length < totalCount;

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Duyệt / sửa dòng chi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="browse-from">Từ ngày</Label>
              <DatePicker
                id="browse-from"
                value={from}
                min={boundsMin}
                max={boundsMax}
                onChange={setFrom}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="browse-to">Đến ngày</Label>
              <DatePicker
                id="browse-to"
                value={to}
                min={boundsMin}
                max={boundsMax}
                onChange={setTo}
              />
            </div>
            <Button type="button" onClick={apply} disabled={loading}>
              {loading ? "Đang tải…" : "Tải dòng"}
            </Button>
          </div>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
        </CardContent>
      </Card>

      {loaded || loading || error ? (
        <div className="flex flex-col gap-3">
          <DetailSheet
            title="Dòng chi theo kỳ"
            totalAmount={totalAmount}
            lines={lines}
            totalCount={totalCount}
            loading={loading}
            error={error}
            editable
            showClose={false}
            onLinesChanged={handleMutated}
            onClose={() => undefined}
          />
          {hasMore && !loading && !error ? (
            <Button
              type="button"
              variant="outline"
              className="self-center"
              disabled={loadingMore}
              onClick={() => void loadPage(from, to, lines.length, true)}
            >
              {loadingMore
                ? "Đang tải thêm…"
                : `Tải thêm (${lines.length.toLocaleString("vi-VN")} / ${totalCount.toLocaleString("vi-VN")})`}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
