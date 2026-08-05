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
        const message = "Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c file l\u00ean m\u00e1y ch\u1ee7.";
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
      toast.success("\u0110\u00e3 \u0111\u1ecdc file. Ki\u1ec3m tra v\u00e0 x\u00e1c nh\u1eadn nh\u1eadp.");
    } catch {
      const message = "Kh\u00f4ng th\u1ec3 x\u1eed l\u00fd file Excel. Vui l\u00f2ng ch\u1ecdn l\u1ea1i file.";
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
        <CardTitle>{"Ch\u1ecdn file Excel"}</CardTitle>
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
            {"K\u00e9o th\u1ea3 ho\u1eb7c nh\u1ea5n \u0111\u1ec3 ch\u1ecdn file"}
          </span>
          <span className="text-xs text-muted-foreground">
            {"H\u1ed7 tr\u1ee3 .xlsx, .xls"}
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
            {"\u0110ang t\u1ea3i l\u00ean v\u00e0 \u0111\u1ecdc file\u2026"}
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
