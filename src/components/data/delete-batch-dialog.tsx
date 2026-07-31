"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ImportBatchRow } from "@/api/data-management";
import { deleteImportBatch } from "@/api/data-management";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd } from "@/lib/spend/format";

type DeleteBatchDialogProps = {
  batch: ImportBatchRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteBatchDialog({
  batch,
  open,
  onOpenChange,
}: DeleteBatchDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteImportBatch(batch.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã xóa lô.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa lô tải lên?</DialogTitle>
          <DialogDescription>
            Xác nhận xóa lô tải lên và toàn bộ dòng chi tiết liên quan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p className="font-medium">{batch.source_filename}</p>
          <p>Số dòng: {batch.fact_rows.toLocaleString("vi-VN")}</p>
          <p>Tổng tiền: {formatVnd(batch.amount_sum)}</p>
          <p className="text-destructive">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleConfirm}
          >
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
