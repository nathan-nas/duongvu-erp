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
import { Label } from "@/components/ui/label";
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
        <div className="grid gap-2">
          <Label htmlFor="hoai-file">File Excel</Label>
          <Input
            id="hoai-file"
            type="file"
            accept=".xlsx,.xls"
            disabled={isParsing}
            onChange={selectFile}
          />
        </div>
        {isParsing && <p aria-live="polite">Đang đọc file…</p>}
        {error && <p className="text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
