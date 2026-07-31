"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSpendLinesByDateRange } from "@/api/data-management";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatViDate, formatVnd } from "@/lib/spend/format";

type DeleteRangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  to: string;
  rowCount: number;
  amountSum: number;
};

export function DeleteRangeDialog({
  open,
  onOpenChange,
  from,
  to,
  rowCount,
  amountSum,
}: DeleteRangeDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const toastId = toast.loading("Đang xóa…");

    startTransition(async () => {
      const result = await deleteSpendLinesByDateRange({ from, to });

      if ("error" in result) {
        toast.error(result.error, { id: toastId });
        return;
      }

      toast.success(
        `Đã xóa ${result.deletedRows.toLocaleString("vi-VN")} dòng.`,
        { id: toastId },
      );
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa dữ liệu theo kỳ?</DialogTitle>
          <DialogDescription>
            Sẽ xóa {rowCount.toLocaleString("vi-VN")} dòng ({formatVnd(amountSum)})
            trong {formatViDate(from)} → {formatViDate(to)}. Các lô rỗng sẽ bị
            dọn dẹp.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-destructive">
          Hành động này không thể hoàn tác.
        </p>
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
