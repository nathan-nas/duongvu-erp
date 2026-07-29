"use client";

import { useState, type ChangeEvent } from "react";
import { ConfirmImport } from "@/components/hoai/confirm-import";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseHoaiWorkbook } from "@/lib/hoai/parse-workbook";
import type { ParsedWorkbookPreview } from "@/lib/hoai/types";

type UploadState = {
  file: ArrayBuffer;
  filename: string;
  preview: ParsedWorkbookPreview;
};

export function UploadWizard() {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setUpload(null);
    setIsParsing(true);

    try {
      const file = await selectedFile.arrayBuffer();
      const preview = parseHoaiWorkbook(file, selectedFile.name);

      if (!preview.hasFactSheet || preview.factRows === 0) {
        setError(
          "Không tìm thấy sheet BANG CHI TIET hoặc không đọc được tiêu đề.",
        );
        return;
      }

      setUpload({ file, filename: selectedFile.name, preview });
    } catch {
      setError("Không thể đọc file Excel. Vui lòng chọn lại file.");
    } finally {
      setIsParsing(false);
    }
  }

  if (upload) {
    return (
      <ConfirmImport
        {...upload}
        onCancel={() => {
          setUpload(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chọn file Excel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label
          htmlFor="hoai-file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <span className="text-3xl">📂</span>
          <span className="text-sm font-medium">
            Kéo thả hoặc nhấn để chọn file
          </span>
          <span className="text-xs text-muted-foreground">
            Hỗ trợ .xlsx, .xls
          </span>
          <Input
            id="hoai-file"
            type="file"
            accept=".xlsx,.xls"
            disabled={isParsing}
            onChange={selectFile}
            className="sr-only"
          />
        </label>
        {isParsing && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Đang đọc file…
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
