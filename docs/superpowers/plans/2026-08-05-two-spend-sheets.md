# Kế hoạch triển khai nhập hai sheet vật tư

1. Bổ sung type summary và trạng thái validation workbook trong `src/lib/spend/types.ts`.
2. Viết test parser cho hai sheet bắt buộc, gộp dữ liệu, thiếu sheet, sheet lỗi header và bỏ qua `BANG CHI TIET`.
3. Refactor `src/lib/spend/parse-workbook.ts` thành helper parse từng sheet; trả summary và lỗi validation có cấu trúc.
4. Viết test Server Action cho thông báo thiếu/không đọc được sheet và contract summary của `prepareImport`.
5. Cập nhật `src/api/import-spend.ts` để chặn prepare/commit và trả `sheetSummaries` cho client.
6. Truyền summary qua `UploadWizard` và hiển thị trong `ConfirmImport` trước tổng cộng và nút xác nhận.
7. Chạy test mục tiêu, sau đó `pnpm lint`, `pnpm typecheck`, `pnpm test`; rà soát diff và git status.
