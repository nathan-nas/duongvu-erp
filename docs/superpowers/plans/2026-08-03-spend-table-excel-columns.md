# Kế hoạch triển khai bảng dòng chi theo Excel

1. Tạo migration sau `20260803130000` để thêm `received_date`, `received_date_raw`, `recipient_name`; drop chữ ký RPC 7 tham số và tái tạo `spend_lines_page` với result shape mới, filter `party`/`p_item_label`, và giữ `security invoker`.
2. Mở rộng `SpendLineDraft`, `SpendLineFields`, `AnalyticsLine` và mapping Excel/Server Action.
3. Thêm test mapping cột N/O và chuẩn hóa ngày nhập hàng.
4. Cập nhật form CRUD cho `Ngày nhập hàng` và `Người mua/nhận`.
5. Refactor `DetailSheet` để hiển thị STT và các cột theo đúng thứ tự ảnh; hỗ trợ cuộn ngang trong cả bảng thường và Virtuoso.
6. Chạy `pnpm lint`, `pnpm typecheck`, `pnpm test`; rà soát diff và trạng thái branch.
7. Kiểm tra contract migration/RPC: chỉ còn chữ ký 7 tham số, có đủ hai output mới, có nhánh đối tác/hàng hóa và quyền chỉ dành cho `authenticated`.
