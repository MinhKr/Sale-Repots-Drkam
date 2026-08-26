ALTER TABLE "employees" ADD COLUMN "depts" "dept"[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
-- Backfill: mỗi người đang có đúng 1 bộ phận, chuyển thẳng thành mảng 1 phần tử.
-- Bắt buộc phải chạy — `depts` là nguồn sự thật cho phân quyền, để rỗng thì
-- deptsOf() phải rơi về `dept` (xem src/lib/employees/depts.ts).
UPDATE "employees" SET "depts" = ARRAY["dept"] WHERE cardinality("depts") = 0;
