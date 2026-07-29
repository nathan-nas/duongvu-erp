"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createImportBatch,
  insertSpendLinesChunk,
  markImportBatchFailed,
} from "@/app/app/actions/import-spend";
import { SPEND_LINE_CHUNK } from "@/lib/spend/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVnd } from "@/lib/spend/format";
import { parseSpendWorkbook } from "@/lib/spend/parse-workbook";
import type { ParsedWorkbookPreview } from "@/lib/spend/types";

const batchKindLabel = {
  annual: "Cả năm",
  period: "Theo kỳ",
  unknown: "Không xác định",
};

type ConfirmImportProps = {
  file: ArrayBuffer;
  filename: string;
  preview: ParsedWorkbookPreview;
  onCancel: () => void;
};

export function ConfirmImport({
  file,
  filename,
  preview,
  onCancel,
}: ConfirmImportProps) {
  const router = useRouter();
  const [periodYear, setPeriodYear] = useState(
    preview.suggestedPeriodYear ?? new Date().getFullYear(),
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmImport() {
    setError(null);
    setProgress(0);

    const parsed = parseSpendWorkbook(file, filename, periodYear);
    const batchResult = await createImportBatch({
      source_filename: filename,
      period_year: periodYear,
      batch_kind: parsed.batchKind,
      fact_rows: parsed.factRows,
      amount_sum: parsed.amountSum,
    });

    if ("error" in batchResult) {
      setError(batchResult.error);
      setProgress(null);
      return;
    }

    for (let start = 0; start < parsed.lines.length; start += SPEND_LINE_CHUNK) {
      const chunk = parsed.lines.slice(start, start + SPEND_LINE_CHUNK);
      const result = await insertSpendLinesChunk(batchResult.batchId, chunk);

      if (result.error) {
        await markImportBatchFailed(batchResult.batchId);
        setError(result.error);
        setProgress(null);
        return;
      }

      setProgress(Math.min(start + chunk.length, parsed.lines.length));
    }

    router.push(`/app/analytics?batch=${batchResult.batchId}`);
  }

  const saving = progress !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xác nhận nhập dữ liệu</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Loại file</p>
          <p>{batchKindLabel[preview.batchKind]}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="period-year">Năm hạch toán</Label>
          <Input
            id="period-year"
            type="number"
            min={2000}
            max={2100}
            value={periodYear}
            disabled={saving}
            onChange={(event) => setPeriodYear(Number(event.target.value))}
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Số dòng</p>
          <p>{preview.factRows.toLocaleString("vi-VN")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tổng thành tiền</p>
          <p>{formatVnd(preview.amountSum)}</p>
        </div>
        {saving && (
          <p aria-live="polite">
            Đang lưu… {progress}/{preview.factRows}
          </p>
        )}
        {error && <p className="text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="button" disabled={saving} onClick={confirmImport}>
          Xác nhận nhập
        </Button>
      </CardFooter>
    </Card>
  );
}
