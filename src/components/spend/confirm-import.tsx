"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  commitImport,
  markImportBatchFailed,
} from "@/api/import-spend";
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
import type { BatchKind } from "@/lib/spend/types";

const batchKindLabel = {
  annual: "Cả năm",
  period: "Theo kỳ",
  unknown: "Không xác định",
};

type ConfirmImportProps = {
  batchId: string;
  filename: string;
  factRows: number;
  amountSum: number;
  batchKind: BatchKind;
  periodYear: number;
  onCancel: () => void;
};

export function ConfirmImport({
  batchId,
  filename,
  factRows,
  amountSum,
  batchKind,
  periodYear: initialPeriodYear,
  onCancel,
}: ConfirmImportProps) {
  const router = useRouter();
  const [periodYear, setPeriodYear] = useState(initialPeriodYear);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmImport() {
    setError(null);
    setSaving(true);

    const result = await commitImport(batchId, periodYear);

    if ("error" in result) {
      await markImportBatchFailed(batchId);
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push(`/app/analytics?batch=${result.batchId}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xác nhận nhập dữ liệu</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Tên file</p>
          <p>{filename}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Loại file</p>
          <p>{batchKindLabel[batchKind]}</p>
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
          <p>{factRows.toLocaleString("vi-VN")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tổng thành tiền</p>
          <p>{formatVnd(amountSum)}</p>
        </div>
        {saving && (
          <p aria-live="polite">Đang lưu dữ liệu trên máy chủ…</p>
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
