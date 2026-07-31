"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteSpendLine } from "@/api/spend-lines";
import type { AnalyticsLine } from "@/api/analytics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd, formatViDate } from "@/lib/spend/format";

type Props = {
  open: boolean;
  line: AnalyticsLine | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function SpendLineDeleteDialog({
  open,
  line,
  onOpenChange,
  onDeleted,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!line) return;
    setBusy(true);
    const result = await deleteSpendLine(line.id);
    setBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã xóa dòng.");
    onOpenChange(false);
    onDeleted();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md duration-200" showCloseButton>
        <DialogHeader>
          <DialogTitle>Xóa dòng chi?</DialogTitle>
          <DialogDescription>
            Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        {line ? (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p>
              {formatViDate(line.payment_date)} ·{" "}
              {line.party_name ?? line.item_name ?? "—"}
            </p>
            <p className="font-medium tabular-nums">
              {line.amount != null ? formatVnd(line.amount) : "—"}
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || !line}
            onClick={() => void confirm()}
          >
            {busy ? "Đang xóa…" : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
