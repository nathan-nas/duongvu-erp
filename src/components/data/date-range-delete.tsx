"use client";

import { useState } from "react";
import { previewDeleteByDateRange } from "@/api/data-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { isIsoDate } from "@/lib/spend/date-range";
import { formatVnd } from "@/lib/spend/format";
import { DeleteRangeDialog } from "./delete-range-dialog";

type DateRangeDeleteProps = {
  boundsMin: string | null;
  boundsMax: string | null;
};

type PreviewState = {
  rowCount: number;
  amountSum: number;
  batchCountTouched: number;
};

export function DateRangeDelete({ boundsMin, boundsMax }: DateRangeDeleteProps) {
  const [from, setFrom] = useState(boundsMin ?? "");
  const [to, setTo] = useState(boundsMax ?? "");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handlePreview() {
    setPreviewError(null);
    setPreview(null);

    if (!isIsoDate(from) || !isIsoDate(to)) {
      setPreviewError("Ngày không hợp lệ.");
      return;
    }

    if (from > to) {
      setPreviewError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }

    setPreviewing(true);
    const result = await previewDeleteByDateRange({ from, to });
    setPreviewing(false);

    if ("error" in result) {
      setPreviewError(result.error);
      return;
    }

    setPreview(result);
  }

  const canDelete = preview != null && preview.rowCount > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Xóa theo kỳ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!boundsMin || !boundsMax ? (
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu giao dịch.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delete-from">Từ ngày</Label>
                  <DatePicker
                    id="delete-from"
                    value={from}
                    min={boundsMin}
                    max={boundsMax}
                    onChange={setFrom}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-to">Đến ngày</Label>
                  <DatePicker
                    id="delete-to"
                    value={to}
                    min={boundsMin}
                    max={boundsMax}
                    onChange={setTo}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewing}
                >
                  {previewing ? "Đang xem trước…" : "Xem trước"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!canDelete}
                  onClick={() => setConfirmOpen(true)}
                >
                  Xóa
                </Button>
              </div>

              {previewError ? (
                <p className="text-sm text-destructive">{previewError}</p>
              ) : null}

              {preview ? (
                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                  {preview.rowCount === 0 ? (
                    <p>Không có dữ liệu trong khoảng này.</p>
                  ) : (
                    <>
                      <p>
                        Số dòng sẽ xóa:{" "}
                        {preview.rowCount.toLocaleString("vi-VN")}
                      </p>
                      <p>Tổng tiền: {formatVnd(preview.amountSum)}</p>
                      {preview.batchCountTouched > 0 ? (
                        <p>
                          Số lô ảnh hưởng:{" "}
                          {preview.batchCountTouched.toLocaleString("vi-VN")}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {preview && preview.rowCount > 0 ? (
        <DeleteRangeDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          from={from}
          to={to}
          rowCount={preview.rowCount}
          amountSum={preview.amountSum}
        />
      ) : null}
    </>
  );
}
