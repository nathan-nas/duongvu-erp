"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSpendLines, type AnalyticsLine } from "@/api/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
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
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (rangeFrom: string, rangeTo: string) => {
    setLoading(true);
    setError(null);
    const result = await fetchSpendLines({
      from: rangeFrom,
      to: rangeTo,
      filterKind: "all",
      filterValue: "",
    });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      setLines([]);
      setTotalCount(0);
      setTotalAmount(0);
      return;
    }
    setLines(result.lines);
    setTotalCount(result.totalCount);
    setTotalAmount(result.totalAmount);
    setLoaded(true);
  }, []);

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
    void load(from, to);
  }

  function handleMutated() {
    if (isIsoDate(from) && isIsoDate(to)) {
      void load(from, to);
    }
    router.refresh();
  }

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
      ) : null}
    </div>
  );
}
