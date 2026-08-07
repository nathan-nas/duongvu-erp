# Thiết kế nhập hai sheet vật tư

## Mục tiêu

Thay nguồn dữ liệu duy nhất `BANG CHI TIET` bằng hai nguồn bắt buộc trong cùng workbook:

- `VẬT TƯ NHÀ MÁY`
- `VẬT TƯ XE`

Chỉ cho phép xác nhận nhập khi cả hai sheet đều tồn tại và đọc được. Sau khi đọc file, màn hình xác nhận phải hiển thị số dòng và tổng thành tiền của từng sheet, cùng tổng cộng của workbook.

## Luồng xử lý

1. Người dùng chọn file và file nguồn được lưu tạm vào Supabase Storage theo luồng hiện tại.
2. Server chuẩn hóa tên sheet không phân biệt hoa thường, dấu tiếng Việt hoặc khoảng trắng.
3. Server kiểm tra đủ cả hai sheet bắt buộc. Thiếu bất kỳ sheet nào thì dừng chuẩn bị import và trả lỗi nêu rõ sheet bị thiếu.
4. Mỗi sheet được tìm header và parse độc lập bằng cùng mapping cột hiện tại.
5. Nếu một sheet không có header hợp lệ thì dừng và báo sheet không đọc được.
6. Các dòng hợp lệ của hai sheet được nối theo thứ tự `VẬT TƯ NHÀ MÁY`, rồi `VẬT TƯ XE`.
7. Màn hình xác nhận hiển thị summary từng sheet trước khi người dùng bấm **Xác nhận nhập**. Chỉ thao tác xác nhận mới ghi các dòng vào `spend_line`.

Lưu ý: file nguồn phải được tải tạm lên Storage để parser server đọc được; “trước khi upload” trong trải nghiệm người dùng được hiểu là trước khi xác nhận nhập dữ liệu nghiệp vụ vào database.

## Contract dữ liệu

`ParsedWorkbookPreview` bổ sung:

- `sheetSummaries`: danh sách gồm tên sheet chuẩn, số dòng hợp lệ và tổng thành tiền.
- `missingSheetNames`: danh sách tên sheet bắt buộc không tìm thấy.
- `unreadableSheetNames`: danh sách sheet tồn tại nhưng không có header hợp lệ.

`factRows` và `amountSum` vẫn là tổng của toàn workbook để giữ tương thích với `import_batch`.

## UI

Màn hình xác nhận giữ nguyên thông tin file, loại file và năm hạch toán. Phần thống kê hiển thị:

- Một hàng/card cho `VẬT TƯ NHÀ MÁY`.
- Một hàng/card cho `VẬT TƯ XE`.
- Tổng cộng số dòng và thành tiền.

Toàn bộ nhãn và thông báo lỗi dùng tiếng Việt, tái sử dụng Card và theme hiện có.

## Ngoài phạm vi

- Không sửa workbook nguồn.
- Không giữ `BANG CHI TIET` làm fallback.
- Không thay schema Postgres hoặc analytics.
- Không thay luồng Storage hiện tại.

## Tiêu chí hoàn thành

1. Thiếu một trong hai sheet thì không thể tới bước xác nhận nhập và lỗi nêu đúng sheet thiếu.
2. Sheet tồn tại nhưng không đọc được header cũng bị chặn.
3. Parser gộp đúng dữ liệu từ hai sheet, không đọc `BANG CHI TIET`.
4. Summary từng sheet xuất hiện trước nút xác nhận, tổng cộng khớp với hai summary.
5. `prepareImport` và `commitImport` cùng áp dụng validation để tránh bypass.
6. `pnpm lint`, `pnpm typecheck` và `pnpm test` đều pass.
