# src/lib/spend

Pure logic for parsing, classifying, and aggregating spend (expense) data from Excel files.

## Responsibilities

- Parse uploaded Excel workbooks into `SpendLineDraft` arrays (`parse-workbook.ts`) — **server-only** via import actions
- Classify batch kind from filename/sheet names (`classify-batch.ts`)
- Normalize dates from various Vietnamese Excel formats (`normalize-date.ts`)
- Extract period year from filenames (`period-year.ts`)
- Map raw spreadsheet rows to typed objects (`map-fact-row.ts`)
- Aggregate helpers for tests / shape parity (`aggregations.ts`); production charts use SQL RPCs
- Storage path helpers (`storage-paths.ts`) and import serialization (`import-pipeline.ts`)
- Format currency (VND) and dates for display (`format.ts`)

## Conventions

- No React, no server dependencies — pure TypeScript functions.
- Each module has a co-located `*.test.ts` file.
- Shared constants in `constants.ts`.
- Types in `types.ts`.
