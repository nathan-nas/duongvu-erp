"use client";

import type { ImportBatchRow } from "@/api/data-management";
import { BatchList } from "./batch-list";
import { DateRangeDelete } from "./date-range-delete";
import { LineBrowser } from "./line-browser";

type DataManagementPageProps = {
  batches: ImportBatchRow[];
  boundsMin: string | null;
  boundsMax: string | null;
  listError?: string | null;
};

export function DataManagementPage({
  batches,
  boundsMin,
  boundsMax,
  listError,
}: DataManagementPageProps) {
  return (
    <div className="flex flex-col gap-8">
      {listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive motion-enter">
          {listError}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Dòng chi</h2>
          <p className="text-sm text-muted-foreground">
            Thêm, sửa hoặc xóa từng dòng trong kỳ đã chọn.
          </p>
        </div>
        <LineBrowser boundsMin={boundsMin} boundsMax={boundsMax} />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Lô tải lên</h2>
          <p className="text-sm text-muted-foreground">
            Xóa cả lô import (không thể hoàn tác).
          </p>
        </div>
        <BatchList batches={batches} />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Xóa theo kỳ</h2>
          <p className="text-sm text-muted-foreground">
            Xóa mọi dòng theo ngày thanh toán; lô trống sẽ bị gỡ.
          </p>
        </div>
        <DateRangeDelete boundsMin={boundsMin} boundsMax={boundsMax} />
      </section>
    </div>
  );
}
