# Thiết kế map cột Excel theo tên header

## Mục tiêu

Cho phép upload workbook dạng `T7_8894.xlsx` (và các file cùng layout) trong khi giữ nguyên nghiệp vụ hiện tại: hai sheet bắt buộc `VẬT TƯ NHÀ MÁY` + `VẬT TƯ XE`, summary từng sheet, Storage → prepare → confirm → commit vào `spend_line`.

Thay mapping theo chỉ số cột cố định bằng **auto-detect theo tên header** (có alias), để chịu được reorder cột và khác biệt nhỏ giữa sheet.

## Bối cảnh / khoảng trống hiện tại

Parser hiện map positional theo layout legacy (`BANG CHI TIET`):

| Index | Field |
|------:|-------|
| 0 | `payment_date` |
| 1 | `party_code` |
| 2 | `party_name` |
| 3 | `uom` |
| 4 | `item_code` |
| 5 | `item_name` |
| 6 | `qty` |
| 7 | `unit_price` |
| 8 | `amount` |
| 9 | `description` |
| 11 | `plant_name` |
| 12 | `expense_code` |
| 13 | `recipient_name` |
| 14 | `received_date` |
| 15 | `payment_method` |
| 16 | `invoice` |
| 17 | `note` |

File kiểm tra `T7_8894.xlsx`:

- Đủ hai sheet bắt buộc; thêm `MÃ NCC` và nhiều sheet nhà máy (bỏ qua).
- Header ở hàng 1; hàng 2 là dòng tổng (chỉ thành tiền).
- Cột A = `STT` → toàn bộ field lệch +1 so với legacy.
- `VẬT TƯ NHÀ MÁY` ~1071 dòng dữ liệu; `VẬT TƯ XE` ~6 dòng.
- Ngày thường là Excel serial (sau `raw: true`); một số `NGÀY NHẬP HÀNG` là chuỗi `dd/mm/yyyy`.
- Tên file không chứa năm → năm hạch toán lấy từ UI override (đã có).

## Quyết định thiết kế

**Approach đã chọn:** bảng alias header → resolve `field → colIndex` mỗi sheet sau khi tìm header row; map từng dòng theo field, không theo vị trí tuyệt đối.

Không dùng schema dual hard-coded và không xây DSL cấu hình nặng.

## Chuẩn hóa header

Trước khi so khớp alias:

1. `String(cell).trim()`
2. Unicode NFC
3. Uppercase
4. Gộp khoảng trắng liên tiếp thành một space
5. Không bắt buộc bỏ dấu (alias liệt kê cả biến thể có/không dấu khi cần)

Header hợp lệ khi tìm thấy **cùng lúc**:

- một cột amount (`THÀNH TIỀN` / alias), và
- một cột payment date (`NGÀY CHI TIỀN` hoặc header chứa `NGÀY` gắn với chi tiền — ưu tiên khớp exact alias trước).

Giữ quét 10 hàng đầu như hiện tại.

## Bảng alias → field

| Field | Alias (khớp sau chuẩn hóa; một cột thắng) |
|-------|-------------------------------------------|
| `payment_date` | `NGÀY CHI TIỀN`, `NGAY CHI TIEN` |
| `party_code` | `MÃ KH`, `MA KH`, `MÃ NCC` (chỉ khi nằm trên sheet fact; không đọc sheet `MÃ NCC`) |
| `party_name` | `NCC`, `TÊN CỬA HÀNG`, `TEN CUA HANG` |
| `received_date` | `NGÀY NHẬP HÀNG`, `NGAY NHAP HANG`, `PHIẾU NGÀY`, `PHIEU NGAY` |
| `item_code` | `MÃ HÀNG`, `MA HANG` |
| `item_name` | `LOẠI HÀNG`, `LOAI HANG`, `TÊN HÀNG`, `TEN HANG` |
| `uom` | `ĐV TÍNH`, `DV TINH`, `ĐVT`, `DVT` |
| `qty` | `SỐ LƯỢNG`, `SO LUONG`, `S. LƯỢNG`, `S. LUONG` |
| `unit_price` | `ĐƠN GIÁ`, `DON GIA` |
| `amount` | `THÀNH TIỀN`, `THANH TIEN` |
| `description` | `DIỄN GIẢI`, `DIEN GIAI` |
| `expense_code` | `MÃ CHI`, `MA CHI`, `MÃ NV`, `MA NV` |
| `recipient_name` | `NGƯỜI MUA/NHẬN`, `NGUOI MUA/NHAN`, `NGƯỜI MUA`, `NGUOI MUA`, `NGƯỜI NHẬN`, `NGUOI NHAN` |
| `plant_name` | `NHÀ MÁY`, `NHA MAY`, `NM` |
| `payment_method` | `HÌNH THỨC THANH TOÁN`, `HINH THUC THANH TOAN`, `THANH TOÁN`, `THANH TOAN` |
| `invoice` | `SỐ HĐ`, `SO HD`, `HÓA ĐƠN`, `HOA DON` |
| `note` | `GHI CHÚ`, `GHI CHU` |

Quy tắc xung đột:

- Một header chỉ gắn một field; khớp alias dài/exact trước fuzzy ngắn.
- `STT` không map vào field nghiệp vụ.
- Cột không nhận diện → bỏ qua.
- Field thiếu trên sheet → `null` (không fail workbook), trừ khi thiếu `payment_date` **và** `amount` ở bước nhận diện header.

## Parse dòng

1. Resolve map cột từ header row.
2. Với mỗi cột date (`payment_date`, `received_date`): đọc cell gốc SheetJS + `dateCellValue` (serial + number format) trước khi đưa vào `parsePaymentDate`.
3. Đọc các field còn lại theo index đã resolve; tái sử dụng `cellStr` / `cellNum` / `parsePaymentDate` / cờ `amount_mismatch`.
4. **Bỏ dòng** khi:
   - không có `payment_date` (raw rỗng) **và** không có `party_name` / `party_code` / `item_name` có nghĩa; hoặc
   - chỉ có `amount` (dòng tổng hàng 2 của `T7_8894`).
5. Giữ thứ tự gộp: toàn bộ dòng hợp lệ `VẬT TƯ NHÀ MÁY`, rồi `VẬT TƯ XE`.
6. Sheet khác workbook: không đọc.

`mapFactRow` đổi contract từ `unknown[]` positional sang object đã resolve (hoặc nhận `Record<field, unknown>`). Test legacy cập nhật sang header-map hoặc fixture AOA có header row thật.

## Tương thích nghiệp vụ / UI

- Không đổi schema Postgres, RPC analytics, hay CRUD tay.
- Confirm import vẫn hiện `sheetSummaries` + tổng.
- Năm hạch toán: filename không có năm → user chọn trên UI (đã có); không suy năm từ `T7`.
- Nhãn bảng dòng chi (`SPEND_LINE_COLUMNS`) đã khớp workbook mới — không đổi.

## Ngoài phạm vi

- Import sheet `MÃ NCC` hoặc sheet theo nhà máy.
- Đổi file nguồn Excel.
- Suy diễn / backfill dữ liệu cũ đã import sai cột.
- Đổi quy tắc bắt buộc hai sheet.

## Tiêu chí hoàn thành

1. `parseSpendWorkbook` trên buffer giống `T7_8894` (hai sheet, header STT-first) cho `hasFactSheet: true`, số dòng/amount khớp khoảng kỳ vọng, field đúng (`payment_date`, `party_name`, `amount`, `plant_name` trên NM, `note` trên XE khi có `GHI CHÚ`).
2. Fixture legacy (header không có `STT`, alias cũ) vẫn map đúng.
3. Thiếu sheet / header không đọc được: hành vi validation hiện tại không đổi.
4. Dòng tổng và dòng trống bị bỏ.
5. `pnpm lint`, `pnpm typecheck`, `pnpm test` pass.
