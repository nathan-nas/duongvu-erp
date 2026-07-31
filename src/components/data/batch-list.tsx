"use client";

import { useState } from "react";
import type { ImportBatchRow } from "@/api/data-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatViDate, formatVnd } from "@/lib/spend/format";
import type { BatchKind } from "@/lib/spend/types";
import { DeleteBatchDialog } from "./delete-batch-dialog";

const batchKindLabel: Record<BatchKind, string> = {
  annual: "Cả năm",
  period: "Theo kỳ",
  unknown: "Không xác định",
};

const statusLabel: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Lỗi",
};

type BatchListProps = {
  batches: ImportBatchRow[];
};

export function BatchList({ batches }: BatchListProps) {
  const [deleteTarget, setDeleteTarget] = useState<ImportBatchRow | null>(
    null,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lô tải lên</CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có lô tải nào.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Tên file</th>
                    <th className="pb-2 pr-3 font-medium">Kỳ</th>
                    <th className="pb-2 pr-3 font-medium">Loại</th>
                    <th className="pb-2 pr-3 font-medium text-right">
                      Số dòng
                    </th>
                    <th className="pb-2 pr-3 font-medium text-right">
                      Tổng tiền
                    </th>
                    <th className="pb-2 pr-3 font-medium">Trạng thái</th>
                    <th className="pb-2 pr-3 font-medium">Ngày tải</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{batch.source_filename}</td>
                      <td className="py-2 pr-3">{batch.period_year}</td>
                      <td className="py-2 pr-3">
                        {batchKindLabel[batch.batch_kind]}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {batch.fact_rows.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatVnd(batch.amount_sum)}
                      </td>
                      <td className="py-2 pr-3">
                        {statusLabel[batch.status] ?? batch.status}
                      </td>
                      <td className="py-2 pr-3">
                        {formatViDate(batch.created_at.slice(0, 10))}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(batch)}
                        >
                          Xóa lô
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {deleteTarget ? (
        <DeleteBatchDialog
          batch={deleteTarget}
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      ) : null}
    </>
  );
}
