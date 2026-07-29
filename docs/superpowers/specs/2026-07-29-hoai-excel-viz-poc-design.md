# 2026-07-29 HOAI Excel upload → visualization POC — design

## Problem

Operations currently track factory / material / payment spend in large Excel workbooks (HOAI). Stakeholders need a web POC: **upload Excel → treat the raw detail table as the system of record for analytics → visualize**.

## Source files analyzed

| File | Size | Primary use |
|------|------|-------------|
| `TH CHI TIẾT NĂM 2025 (HOAI) (1).xlsx` | ~2.9 MB | Annual detail (~19.3k fact rows; ~75.0B VND sum) |
| `VAT TU T12-2025 (HOAI).xlsx` | ~8.5 MB | Dec materials + many filter tabs (~5.9k fact rows; ~4.0B VND sum) |

## Sheet taxonomy

| Sheet | Business role | POC |
|-------|---------------|-----|
| **BANG CHI TIET** | Raw spend / purchase **fact** lines | **Ingest + visualize** |
| **MKH** | Master of codes (NCC, employees, vehicles, factory ops, item codes) | Dimension join (P2) |
| **T.HỢP** | Plant monthly rollups / multi-year summary | Out of POC (reconcile later) |
| **CHI TIẾT MÁY** | Machine-level material detail | Out of POC |
| Tabs `1`…`8`, plant names | Same fact schema; same nonempty row count as BANG CHI TIET | **Ignore** (duplicates / views) |
| LỊCH TT CK / BÁO CK | Bank-transfer schedule / report | Out of POC |

**Decision:** POC uses **BANG CHI TIET** as the only fact source. Do not sum plant tabs or they will double-count.

## Fact grain

One row = one payment/purchase line:

- Time: `Ngày chi tiền`
- Party: `MÃ KH`, `TÊN CỬA HÀNG`
- Item: `Mã hàng`, `TÊN HÀNG`, `ĐVT`
- Measures: `S. LƯỢNG`, `ĐƠN GIÁ`, `THÀNH TIỀN`
- Cost center: `NM` (plant / warehouse area)
- Expense code: `MÃ` (often `Txx`, linked to MKH ranges)
- Settlement: `THANH TOÁN` (TM, CK, HKD CK, …)
- Audit text: `DIỄN GIẢI`, `HÓA ĐƠN`, `GHI CHÚ`, `NGƯỜI NHẬN`, `PHIẾU NGÀY`

**Integrity rule:** `THÀNH TIỀN ≈ S. LƯỢNG × ĐƠN GIÁ` (observed few mismatches). Keep signed amounts (negatives = adjustments).

## MKH master (legend from workbook)

Approximate ranges (from sheet header notes):

- Supplier codes (`N…`) / NCC list
- Employees
- Company vehicles
- Factory activity codes
- From ~346 onward: goods codes

Ingest MKH as typed dimension rows with `code`, `name`, `category`.

## Data quality rules (core logic)

1. **Sheet detection:** require `BANG CHI TIET` (case/spacing tolerant).
2. **Header row:** row 3 in samples; detect by column name set.
3. **Date normalize:** cells often look like `412`, `1812` (D+MM) not Excel dates. Parse with `period_year` from filename (editable on confirm). Invalid → `payment_date_raw` kept, row flagged.
4. **Code normalize:** uppercase trim (`t13` → `T13`).
5. **Numeric coerce:** qty, unit_price, amount; empty trailing rows dropped.
6. **Mismatch flag:** `|qty * unit_price - amount| > 1` VND (or relative tolerance).
7. **Batching:** each upload → `import_batch` (filename, uploader, year, row counts, amount sum).

## Target metrics (visualization)

- KPI: total spend (net), line count, distinct plants, distinct parties
- Charts: **equal first-screen pair** — spend by `NM` and spend by `MÃ`; then by calendar month; by `THANH TOÁN`; top parties
- Filters: date range, plant, code, payment method, batch
- Detail table: searchable fact grid

## Application architecture (fits duongvu-erp)

```
User → /app/uploads (auth) → parse xlsx → validate → Supabase
                                              ├ import_batch
                                              ├ spend_line (clean)
                                              └ spend_line_raw (optional JSON)
     → /app/analytics ← query spend_line → charts + table
```

Stack already chosen: Next.js, Supabase, shadcn, Zustand (UI only), Vercel.

### Suggested tables (POC)

- `import_batch(id, user_id, source_filename, period_year, batch_kind, fact_rows, amount_sum, status, created_at)`
- `spend_line(id, batch_id, payment_date, payment_date_raw, party_code, party_name, item_code, item_name, uom, qty, unit_price, amount, plant_name, expense_code, payment_method, description, invoice, note, quality_flags jsonb)`
- `code_master(id, batch_id nullable, code, name, category)` — from MKH when present

DB / code identifiers stay English. UI labels are Vietnamese (aligned with Excel headers where helpful).

**i18n approach (POC):** hardcode Vietnamese strings in UI components (no English UI). Optional later: `next-intl` if a second locale appears. Do not ship bilingual screens in POC. Format money/dates with `vi-VN` / VND.

RLS: rows visible to owning `user_id` only (shell has no orgs yet).

## Phased plan

| Phase | Scope | Done when |
|-------|--------|-----------|
| **P0 Ingest** | Upload + parse BANG CHI TIET for **both** file types → DB; tag `batch_kind` (`annual` \| `period`) | Each sample file loads; Dec ~5.9k / ~4.0B; Year ~19.3k / ~75.0B |
| **P1 Dashboard** | KPIs + charts + filters + **batch switcher** | Same filters match Excel pivot for selected batch |
| **P2 Master** | MKH join for labels (when sheet present) | Codes show names |
| **P3 Quality** | Date/code/amount flags in UI | Months sort as real calendar |
| **P4 Compare** | Optional multi-batch overlay (year vs month) | User can compare two batches |

## Out of scope (explicit)

- Recreating Excel formulas / pivot cache
- Writing back to Excel
- Accounting close / GL posting
- Bank payment workflow (LỊCH TT CK)
- Org/multi-tenant sharing
- Treating plant tabs as additional facts

## Stakeholder decisions

- **Upload formats:** Support **both** workbook types from day one:
  - Annual detail: `TH CHI TIẾT NĂM … (HOAI).xlsx` (fact ≈ year-to-date / full year)
  - Period materials: `VAT TU T… (HOAI).xlsx` (e.g. T12)
- **UI:** User can upload either (or both over time). Analytics has a **batch / file switcher** (and optional multi-batch compare later). Same parser pipeline; classify batch by detected sheets + filename hints (`NĂM` vs `VAT TU` / `T12`).
- **P1 primary charts:** First analytics screen shows **two equal charts**:
  1. Spend by plant / cost center (`NM`)
  2. Spend by expense code (`MÃ` / Txx)
  Plus KPI strip and batch switcher; payment-method / top-party charts can sit below or on a second row without dominating.
- **Period year for ambiguous dates:** Default from **filename** (e.g. `2025`); show on **confirm-upload** screen so the user can **override** before rows are written.
- **Locale / UI language:** Application is for **Vietnam users**. All user-facing UI copy must be **Vietnamese** (labels, buttons, errors, empty states, chart titles, confirm dialogs). Keep internal code identifiers / DB column names in English. Number/currency formatting: **vi-VN** (VND). Dates display: Vietnamese-friendly (`dd/MM/yyyy`).

## Upload confirm step (required)

After parse / before persist:

1. Show detected `batch_kind`, fact row count, amount sum, sheet names found.
2. Show `period_year` (filename default) as editable field.
3. User confirms → insert `import_batch` + `spend_line`.

No remaining product open questions for POC scope; ready for implementation plan after design approval.
