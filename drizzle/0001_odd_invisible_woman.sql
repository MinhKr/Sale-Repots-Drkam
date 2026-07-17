-- Thêm cột short_name (tên gọi ngắn hiển thị ở bảng/dashboard).
-- Bảng đã có dữ liệu nên không ADD COLUMN NOT NULL trực tiếp được:
-- thêm kèm DEFAULT '' để lấp các dòng cũ, rồi DROP DEFAULT để insert sau này buộc phải truyền giá trị.
ALTER TABLE "employees" ADD COLUMN "short_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "short_name" DROP DEFAULT;
