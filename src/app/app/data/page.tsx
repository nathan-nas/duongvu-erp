import { DataManagementPage } from "@/components/data/data-management-page";
import { fetchSpendDateBounds } from "@/api/analytics";
import { listImportBatches } from "@/api/data-management";

export default async function DataPage() {
  const [bounds, batchesResult] = await Promise.all([
    fetchSpendDateBounds(),
    listImportBatches(),
  ]);

  const batches = "batches" in batchesResult ? batchesResult.batches : [];
  const listError = "error" in batchesResult ? batchesResult.error : null;

  return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="motion-enter">
          <h1 className="text-2xl font-semibold">Quản lý dữ liệu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Duyệt dòng chi, xóa lô tải lên hoặc xóa theo kỳ giao dịch.
          </p>
        </div>
      <DataManagementPage
        batches={batches}
        boundsMin={bounds.min}
        boundsMax={bounds.max}
        listError={listError}
      />
    </main>
  );
}
