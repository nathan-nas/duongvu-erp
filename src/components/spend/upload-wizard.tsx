"use client";

import { useState, type ChangeEvent } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  createPendingBatch,
  prepareImport,
} from "@/api/import-spend";
import { ConfirmImport } from "@/components/spend/confirm-import";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { SPEND_UPLOADS_BUCKET } from "@/lib/spend/constants";
import { extractPeriodYearFromFilename } from "@/lib/spend/period-year";
import type { BatchKind, SpendSheetSummary } from "@/lib/spend/types";

type PreparedUpload = {
  batchId: string;
  filename: string;
  factRows: number;
  amountSum: number;
  sheetSummaries: SpendSheetSummary[];
  batchKind: BatchKind;
  periodYear: number;
};

export function UploadWizard() {
  const [prepared, setPrepared] = useState<PreparedUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setPrepared(null);
    setIsWorking(true);

    try {
      const suggestedYear =
        extractPeriodYearFromFilename(selectedFile.name) ??
        new Date().getFullYear();

      const pending = await createPendingBatch({
        source_filename: selectedFile.name,
        period_year: suggestedYear,
      });

      if ("error" in pending) {
        setError(pending.error);
        toast.error(pending.error);
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(SPEND_UPLOADS_BUCKET)
        .upload(pending.storagePath, selectedFile, {
          contentType: selectedFile.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        const message = "Không tải được file lên máy chủ.";
        setError(message);
        toast.error(message);
        return;
      }

      const preview = await prepareImport(pending.batchId);
      if ("error" in preview) {
        setError(preview.error);
        toast.error(preview.error);
        return;
      }

      setPrepared({
        batchId: preview.batchId,
        filename: preview.sourceFilename,
        factRows: preview.factRows,
        amountSum: preview.amountSum,
        sheetSummaries: preview.sheetSummaries,
        batchKind: preview.batchKind,
        periodYear:
          preview.suggestedPeriodYear ?? preview.periodYear ?? suggestedYear,
      });
      toast.success("Đã đọc file. Kiểm tra và xác nhận nhập.");
    } catch {
      const message = "Không thể xử lý file Excel. Vui lòng chọn lại file.";
      setError(message);
      toast.error(message);
    } finally {
      setIsWorking(false);
      event.target.value = "";
    }
  }

  if (prepared) {
    return (
      <ConfirmImport
        {...prepared}
        onCancel={() => {
          setPrepared(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <Card className="motion-enter">
      <CardHeader>
        <CardTitle>Chọn file Excel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label
          htmlFor="spend-file"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-6 py-10 text-center transition-[transform,border-color,background-color] duration-[160ms] ease-[var(--ease-out)] hover:border-primary/50 hover:bg-muted/50 active:scale-[0.99]"
        >
          <FileSpreadsheet
            className="size-10 text-muted-foreground empty-float"
            aria-hidden
          />
          <span className="text-sm font-medium">
            Kéo thả hoặc nhấn để chọn file
          </span>
          <span className="text-xs text-muted-foreground">
            Hỗ trợ .xlsx, .xls
          </span>
          <Input
            id="spend-file"
            type="file"
            accept=".xlsx,.xls"
            disabled={isWorking}
            onChange={selectFile}
            className="sr-only"
          />
        </label>
        {isWorking && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Đang tải lên và đọc file…
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
