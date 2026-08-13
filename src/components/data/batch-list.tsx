"use client";

import { useMemo, useState } from "react";
import type { ImportBatchRow } from "@/api/data-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
  type DataTableTrailingColumn,
} from "@/components/ui/data-table";
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

  const columns = useMemo<DataTableColumn<ImportBatchRow>[]>(
    () => [
      {
        id: "source_filename",
        label: "Tên file",
        defaultWidth: 220,
        cell: (batch) => batch.source_filename,
      },
      {
        id: "period_year",
        label: "Kỳ",
        defaultWidth: 80,
        cell: (batch) => batch.period_year,
      },
      {
        id: "batch_kind",
        label: "Loại",
        defaultWidth: 110,
        cell: (batch) => batchKindLabel[batch.batch_kind],
      },
      {
        id: "fact_rows",
        label: "Số dòng",
        align: "right",
        defaultWidth: 90,
        cell: (batch) => batch.fact_rows.toLocaleString("vi-VN"),
      },
      {
        id: "amount_sum",
        label: "Tổng tiền",
        align: "right",
        defaultWidth: 130,
        cell: (batch) => formatVnd(batch.amount_sum),
      },
      {
        id: "status",
        label: "Trạng thái",
        defaultWidth: 110,
        cell: (batch) => statusLabel[batch.status] ?? batch.status,
      },
      {
        id: "created_at",
        label: "Ngày tải",
        defaultWidth: 120,
        cell: (batch) => formatViDate(batch.created_at.slice(0, 10)),
      },
    ],
    [],
  );

  const trailingColumn = useMemo<DataTableTrailingColumn<ImportBatchRow>>(
    () => ({
      label: "",
      width: 100,
      cell: (batch) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteTarget(batch)}
        >
          Xóa lô
        </Button>
      ),
    }),
    [],
  );

  return (
    <>
      <DataTable.Root tableId="import_batches" columns={columns}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <CardTitle>Lô tải lên</CardTitle>
            <DataTable.ColumnPicker />
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DataTable.Table
              rows={batches}
              getRowId={(batch) => batch.id}
              trailingColumn={trailingColumn}
              emptyMessage="Chưa có lô tải nào."
              virtualize={false}
            />
          </CardContent>
        </Card>
      </DataTable.Root>

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
