# Chi theo đối tác — analytics treemap

**Date:** 2026-08-03  
**Status:** Approved

## Summary

Add a third analytics treemap on **Phân tích** that groups spend by supplier/counterparty (**đối tác**), using a composite label from `party_code` + `party_name`. Clicking a block opens the existing paged line detail panel with total spent on that party.

## Goals

- Let users see spend concentration by đối tác within the selected **Kỳ giao dịch**
- Drill into contributing spend lines (hàng hóa, qty, amount, …) with **Tải thêm**
- Reuse plant / expense patterns (SQL agg + `spend_lines_page` branch)

## Non-goals

- KPI “Số đối tác”
- URL deep-link `?party=`
- Master NCC / supplier table or org schema
- Client-side aggregation of full date ranges

## Drill-down (updated)

Clicking a đối tác block opens:

1. **Hàng hóa** summary table for that supplier (`spend_agg_items_for_party`)
2. Paged spend **lines** for all items of that supplier
3. Click a Hàng hóa row → lines filter to that item (`p_item_label`); **Tất cả hàng hóa** clears the filter

Item labels use the same composite pattern as đối tác (`mã — tên`).

## Architecture

1. RPC `spend_agg_by_party(p_from, p_to, p_top)` → `(label, amount, count)`
2. RPC `spend_agg_items_for_party(p_from, p_to, p_party_label)` → item rollup
3. `spend_lines_page` filter kind `party` (+ optional `p_item_label`)
4. RSC loads party aggregates; dashboard shows full-width treemap between plant/expense row and monthly chart
5. Party click → item table + lines; item click → filtered lines

## Security

- `SECURITY INVOKER` RPCs; RLS on `spend_line` via `auth.uid() = user_id`
- Grant `EXECUTE` to `authenticated` only

## UI (Vietnamese)

- Card title: **Chi theo đối tác**
- Hint: **Nhấn biểu đồ để lọc chi tiết**
- Drill title: `Đối tác: {label}`
- Detail columns unchanged (existing line sheet)
