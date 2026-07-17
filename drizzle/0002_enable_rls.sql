-- ============================================================================
-- P8.4 — BẬT ROW LEVEL SECURITY (RLS) CHO TOÀN BỘ 9 BẢNG
-- ============================================================================
--
-- VÌ SAO CẦN:
-- Anon key được nhúng vào JavaScript gửi xuống trình duyệt → ai cũng đọc được.
-- Không có RLS, bất kỳ ai biết URL project đều gọi thẳng PostgREST và tải sạch
-- dữ liệu, bỏ qua hoàn toàn code Next.js. RLS là luật nằm TRONG Postgres nên
-- không thể lách bằng cách gọi API trực tiếp.
--
-- CƠ CHẾ:
-- ENABLE ROW LEVEL SECURITY = mặc định CẤM HẾT. Sau đó mở lại đúng những gì cần
-- bằng POLICY. Bảng đã bật RLS mà không có policy nào cho một role → role đó
-- không thấy dòng nào.
--
-- QUY TẮC (theo PM chốt 2026-07-16 — 1 tài khoản dùng chung cho văn phòng):
--   • authenticated (đã đăng nhập) → TOÀN QUYỀN đọc/ghi
--   • anon (chưa đăng nhập)        → KHÔNG có policy nào ⇒ CẤM SẠCH
--
-- GHI CHÚ QUAN TRỌNG:
-- Kết nối Drizzle (user `postgres`, chủ sở hữu bảng) MẶC ĐỊNH BỎ QUA RLS.
-- Nên seed/migrate vẫn chạy bình thường, và Server Actions ở P9 vẫn truy vấn
-- được — nhưng đổi lại P9 PHẢI tự kiểm tra phiên đăng nhập ở phía server.
-- RLS ở đây bịt đường tấn công qua PostgREST bằng anon key (đường đang hở).
-- ============================================================================

-- employees
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "employees_authenticated_all" ON "employees"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- reports_sale
ALTER TABLE "reports_sale" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_sale_authenticated_all" ON "reports_sale"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- reports_cskh
ALTER TABLE "reports_cskh" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_cskh_authenticated_all" ON "reports_cskh"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- reports_bad_review
ALTER TABLE "reports_bad_review" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_bad_review_authenticated_all" ON "reports_bad_review"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- reports_livestream
ALTER TABLE "reports_livestream" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_livestream_authenticated_all" ON "reports_livestream"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- reports_marketing
ALTER TABLE "reports_marketing" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_marketing_authenticated_all" ON "reports_marketing"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- kpi_config
ALTER TABLE "kpi_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "kpi_config_authenticated_all" ON "kpi_config"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- wholesale_customers
ALTER TABLE "wholesale_customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "wholesale_customers_authenticated_all" ON "wholesale_customers"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint

-- wholesale_contact_logs
ALTER TABLE "wholesale_contact_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "wholesale_contact_logs_authenticated_all" ON "wholesale_contact_logs"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
