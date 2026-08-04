# Thiết kế bảng dòng chi theo cột Excel

## Mục tiêu

Hiển thị bảng dòng chi theo đúng thứ tự và cách gọi cột trong ảnh tham chiếu, đồng thời bảo toàn dữ liệu từ sheet `BANG CHI TIET` thay vì dựng cột rỗng ở UI.

## Kết quả kiểm tra Excel

File kiểm tra: `D:\DuongVuAttachments\VAT TU T12-2025 (HOAI).xlsx`.

Sheet `BANG CHI TIET` có 62.061 hàng, vùng dùng `A1:S62061`. Header ở hàng 3 cung cấp đủ dữ liệu cần thiết:

| Cột UI | Nguồn Excel | Field |
|---|---|---|
| STT | Tính theo thứ tự hiển thị | Không lưu DB |
| Ngày chi tiền | A — `Ngày chi tiền` | `payment_date` |
| NCC | C — `TÊN CỬA HÀNG` | `party_name` |
| Ngày nhập hàng | O — `PHIẾU NGÀY` | `received_date` |
| Loại hàng | F — `TÊN HÀNG` | `item_name` |
| ĐV tính | D — `ĐVT` | `uom` |
| Số lượng | G — `S. LƯỢNG` | `qty` |
| Đơn giá | H — `ĐƠN GIÁ` | `unit_price` |
| Thành tiền | I — `THÀNH TIỀN` | `amount` |
| Diễn giải | J — `DIỄN GIẢI` | `description` |
| Người mua/nhận | N — `NGƯỜI NHẬN` | `recipient_name` |
| Nhà máy | L — `NM` | `plant_name` |
| Số HĐ | Q — `HÓA ĐƠN` | `invoice` |

Các cột O và N hiện chưa được parser lưu. Các cột P (`THANH TOÁN`), Q (`HÓA ĐƠN`) và R (`GHI CHÚ`) đã có mapping tương ứng `payment_method`, `invoice`, `note`.

## Thiết kế dữ liệu

Thêm vào `spend_line`:

- `received_date date`: ngày nhập hàng đã chuẩn hóa từ `PHIẾU NGÀY`.
- `received_date_raw text`: giữ giá trị nguồn để không mất thông tin khi ngày không hợp lệ.
- `recipient_name text`: người mua/nhận từ `NGƯỜI NHẬN`.

Các cột nullable để migration không khóa luồng hiện tại và tương thích với dòng nhập tay/dữ liệu cũ. Dữ liệu cũ giữ `null`; muốn có hai field mới phải import lại file nguồn.

RPC `spend_lines_page` tiếp tục là `security invoker`, giữ nguyên filter/index path và chỉ mở rộng result columns.

### Tích hợp với analytics theo đối tác

Sau khi merge tính năng analytics theo đối tác, RPC chuẩn là phiên bản 7 tham số có
`p_item_label text default null`. Migration của tính năng này phải chạy sau
`20260803130000_spend_item_label_display.sql` và tái tạo duy nhất chữ ký:

`spend_lines_page(date, date, text, text, int, int, text)`.

Result của RPC phải đồng thời chứa `received_date`, `recipient_name` và giữ nguyên
các nhánh `all`, `plant_name`, `expense_code`, `month`, `party`, bao gồm bộ lọc
hàng hóa bằng `spend_item_label`. Function dùng `security invoker`, thu hồi quyền
`PUBLIC` và chỉ cấp `EXECUTE` cho `authenticated` để RLS của `spend_line` tiếp tục
giới hạn dữ liệu theo người dùng.

## Thiết kế UI

- Bảng dùng đúng thứ tự cột trong ảnh tham chiếu.
- `STT` được tính từ thứ tự hiện tại của danh sách đã sort.
- Cột text dài dùng giới hạn chiều rộng + tooltip; bảng có cuộn ngang.
- Giữ phân trang 400 dòng và Virtuoso.
- Form thêm/sửa bổ sung `Ngày nhập hàng` và `Người mua/nhận` để CRUD không làm mất field mới.
- `Mã chi` không còn là cột mặc định vì không xuất hiện trong ảnh tham chiếu; dữ liệu vẫn được giữ cho analytics/filter.

## Phạm vi ngoài

- Không sửa file Excel nguồn.
- Không đổi logic analytics hoặc bộ lọc theo `payment_date`.
- Không tự suy diễn/backfill `received_date` cho dữ liệu cũ.

## Tiêu chí hoàn thành

1. Import mới lưu đúng O → `received_date` và N → `recipient_name`.
2. RPC/Server Actions trả đủ hai field mới.
3. Bảng hiển thị đúng 13 cột nghiệp vụ theo ảnh, cộng cột thao tác khi editable.
4. Thêm/sửa dòng hỗ trợ hai field mới.
5. `pnpm lint`, `pnpm typecheck`, `pnpm test` đều pass.
6. Toàn bộ migration có thể replay theo timestamp mà không đổi `RETURNS TABLE`
   bằng `create or replace`.
7. RPC 7 tham số trả đủ `received_date` và `recipient_name` cho cả filter đối tác
   và hàng hóa.
