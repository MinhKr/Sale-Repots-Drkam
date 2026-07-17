# Lộ trình phát triển — Sales Report DrKam

> **Bảng bám phiên làm việc.** Mỗi lần vào việc, mở file này, làm đúng 1 phiên (hoặc tiếp phiên dở), tick trạng thái khi xong.

## 🔑 Nguyên tắc quan trọng (thay đổi so với kế hoạch gốc)

1. **Design-first / fake data:** Dựng **đầy đủ toàn bộ màn hình + tab** bằng **dữ liệu giả (mock)** trước. **KHÔNG** động vào Supabase/DB/Auth thật cho tới khi design được **duyệt OK**.
2. **Tên nhân viên dùng tên thật** trong mock data (xem danh sách dưới).
3. Chốt design ✅ (Phiên 6) rồi **mới** sang Giai đoạn 2 đổ dữ liệu thật.
4. **Theme màu ĐỎ DrKam** (`#D32027`) — xem `docs/design-tokens.md`, không dùng xanh dương của kế hoạch cũ.

## 👥 Nhân sự thật — 13 người (PM chốt 2026-07-16)

| Bộ phận | Họ tên đầy đủ | Tên hiển thị | Ghi chú |
|---|---|---|---|
| `SALE` | Trần Thị Hoài Phượng | Phượng Sale | |
| `CSKH` | Nguyễn Thu Phương | Phương CSKH | |
| `CSKH` | Nguyễn Thị Chinh | Chinh | |
| `CSKH` | Nguyễn Thi Hương | Hương | kiêm admin — PM chốt vẫn thuộc CSKH |
| `LIVESTREAM` | Bàn Minh Thư | Thư | fulltime MB |
| `LIVESTREAM` | Nguyễn Thu Thủy | Thủy MB | parttime MB |
| `LIVESTREAM` | Trần Thị Bình | Bình | parttime MB |
| `LIVESTREAM` | Trần Thị Diệu Linh | Diệu Linh | parttime MB |
| `LIVESTREAM` | Nguyễn Thị Thanh Thúy | Thanh Thúy MN | fulltime MN |
| `LIVESTREAM` | Trần Thanh Vy | Vy MN | parttime MN |
| `LIVESTREAM` | Trần Thị Thu Trang | Trang MN | parttime MN |
| `MKT` | Nguyễn Thị Hà | Hà | marketing ads |
| `LEAD` | Lê Hoài Ly | Ly | Leader / BGĐ |

**Tổng:** Sale 1 · CSKH 3 · Livestream **7** · MKT 1 · Lead 1.

> CSKH có thể nhập cả tab **Sao Xấu**. Livestream + MKT do **Lead nhập hộ**.
>
> **Tên hiển thị** (`short_name`) có hậu tố phân biệt vì dễ nhầm: *Phượng* (Sale) vs *Phương* (CSKH); *Thủy MB* (Nguyễn Thu Thủy) vs *Thanh Thúy MN* (Nguyễn Thị Thanh Thúy). Bảng/dashboard dùng tên hiển thị; hồ sơ cá nhân + user menu dùng họ tên đầy đủ.
>
> Thông tin **fulltime/parttime + miền** hiện **không lưu DB** (PM chốt chưa cần) — chỉ ghi chú ở đây.

---

## 🟥 GIAI ĐOẠN 1 — DEMO UI + DỮ LIỆU FAKE

| Phiên | Mục tiêu | Deliverable | Done khi |
|---|---|---|---|
| **P0** | Nền móng + design system | Next.js 15 (TS strict), `tailwind.config` màu đỏ DrKam, shadcn/ui, font Montserrat/Inter, layout shell (Sidebar + Header + user menu), `lib/mock/` chứa data giả + tên NV thật | `npm run dev` chạy, thấy shell + màu brand đúng |
| **P1** | Đăng nhập + Trang chủ + Dashboard team | Màn Login (UI, fake — bấm vào /home), Trang chủ với Dashboard team (doanh thu hôm qua/tuần/tháng, xếp hạng, biểu đồ Recharts) từ mock | Xem được dashboard team với số liệu giả, có biểu đồ |
| **P2** | Tab Sale + Tab CSKH | Bảng danh sách báo cáo + nút "Nhập báo cáo" mở Dialog form (ô vàng nhập, ô xanh tự tính bằng React state), sửa dòng — tất cả trên mock | Nhập/sửa form thấy số tự tính chạy, bảng cập nhật (state) |
| **P3** | Tab Sao Xấu + Livestream + MKT | Sao Xấu (khối cảnh báo tồn lũy kế theo ngưỡng), Livestream (bulk 6 dòng), MKT | 3 tab hiển thị + nhập được trên mock |
| **P4** | Dashboard cá nhân + Pipeline khách sỉ | Dashboard cá nhân (biểu đồ Recharts theo NV), Pipeline khách sỉ (bảng/kanban + log liên hệ) | Chọn NV xem dashboard; pipeline kéo/xem được |
| **P5** | Cấu hình KPI + Xuất báo cáo (UI) | Màn cấu hình KPI theo tháng (form), màn Xuất báo cáo (nút xuất — mock, chưa sinh file thật) | 2 màn hiển thị + thao tác UI đầy đủ |
| **P6** | 🎯 Rà soát toàn bộ + polish + **DUYỆT DESIGN** | Đi hết 11 màn, responsive, thống nhất spacing/màu/typography. **Chốt design với PM** | ✅ PM duyệt "design OK" → mở khóa Giai đoạn 2 |

**11 màn:** Đăng nhập · Trang chủ · 5 tab (Sale, CSKH, Sao Xấu, Livestream, MKT) · Dashboard cá nhân · Pipeline khách sỉ · Cấu hình KPI · Xuất báo cáo.

---

## 🟧 GIAI ĐOẠN 2 — ĐỔ DỮ LIỆU THẬT + DB *(chỉ bắt đầu sau khi P6 duyệt OK)*

| Phiên | Mục tiêu | Deliverable | Done khi |
|---|---|---|---|
| **P7** | Supabase + Drizzle schema | Tạo Supabase project, viết schema 11 bảng (Drizzle), migrate, seed 4 dept + tên NV thật + Lead | 11 bảng có trên Supabase, seed xong |
| **P8** | Auth thật + RLS | Supabase Auth (email/password), middleware check session, RLS policies | Đăng nhập thật → /home; user chỉ thấy data được phép |
| **P9** | Server Actions — 5 loại báo cáo | Thay mock bằng real: create/update/list cho Sale, CSKH, Sao Xấu, Live, MKT (+ Zod validate, revalidatePath) | Nhập báo cáo lưu DB thật, reload vẫn còn |
| **P10** | Server Actions — Dashboard/KPI/Pipeline/Employees | getTeamDashboard, getPersonalDashboard, getSubmissionStatus, KPI config, wholesale, quản lý NV | Dashboard/KPI/pipeline chạy trên data thật |
| **P11** | Xuất báo cáo thật | exceljs (.xlsx) + docx (.docx), upload Supabase Storage, trả link tải | Bấm xuất ra file thật tải được |

---

## 🟩 GIAI ĐOẠN 3 — HOÀN THIỆN & BÀN GIAO

| Phiên | Mục tiêu | Done khi |
|---|---|---|
| **P12** | Testing + UAT | Chạy hết luồng, fix bug, PM nghiệm thu 2 ngày |
| **P13** | Deploy | Vercel + domain `sales.drkam.vn`, Supabase Pro + backup, env vars |
| **P14** | Training + bàn giao | Tài liệu Lead/NV, video, bàn giao source + tài khoản |

---

## 📌 Trạng thái hiện tại

- [x] Kết nối GitHub repo, khởi tạo repo
- [x] Chốt theme màu đỏ DrKam (`docs/design-tokens.md`)
- [x] Lập lộ trình này
- [x] Chốt danh sách nhân sự thật (11 NV + Lead)
- [x] **P0 — Scaffold Next.js 16 + design system** (shell Sidebar/Header/user menu, theme đỏ DrKam, mock nhân sự, 11 route placeholder + Login + Trang chủ)
- [x] **P1 — Đăng nhập + Trang chủ Dashboard team** (4 KPI tiles doanh thu hôm qua/tuần/tháng + tiến độ mục tiêu, biểu đồ Recharts 14 ngày, bảng xếp hạng NV có medal + progress + badge trạng thái)
- [x] **P2 — Tab Sale + Tab CSKH** (khung config-driven: bảng danh sách + Dialog form ô vàng nhập tay / ô xanh tự tính real-time bằng React state, thêm/sửa dòng cập nhật state; Sale theo schema kế hoạch, CSKH bộ chỉ số tương đương)
- [x] **P3 — Tab Sao Xấu + Livestream + MKT** (Sao Xấu: khối cảnh báo tồn lũy kế theo ngưỡng, tính live; Livestream: form bulk 6 dòng + dán nhanh từ TikTok Center; MKT: form CPL/CPM/ROAS tái dùng khung)
- [x] **P4 — Dashboard cá nhân + Pipeline khách sỉ** (Dashboard cá nhân: chọn NV → stat tiles + LineChart Recharts 14 ngày; Pipeline: kanban 5 giai đoạn, kéo-thả đổi trạng thái (native DnD), filter theo NV, dialog chi tiết + timeline log liên hệ + thêm log)
- [~] **P5 — Cấu hình KPI** ✅ (form mục tiêu theo tháng cho 4 bộ phận + 11 NV, ngưỡng cảnh báo, sao chép tháng trước, tổng mục tiêu team) · **Xuất báo cáo: TẠM HOÃN** (theo yêu cầu — vẫn là placeholder)
- [~] **P6 — Rà soát + polish** ✅ (PageHeader dùng chung cho 10 màn, chuẩn container max-w-6xl/space-y-6 (KPI form max-w-3xl), nhãn placeholder Xuất báo cáo về "giai đoạn sau") · **CHỜ PM DUYỆT DESIGN** để mở khóa Giai đoạn 2
- [x] **P7 — Supabase + Drizzle schema + seed** ✅ (2026-07-16)
  - Supabase project (region Singapore), kết nối qua **Session pooler** (mạng không có IPv6 nên Direct Connection không dùng được)
  - **9 bảng**: `employees` · 5 bảng báo cáo (`reports_sale/cskh/bad_review/livestream/marketing`) · `kpi_config` · `wholesale_customers` + `wholesale_contact_logs`
  - Quyết định schema: **bảng riêng, cột số rõ ràng** (không JSONB) · **lưu cả ô nhập lẫn ô tự tính** · `employees.id` = uuid + cột `code` (slug) để map mock · tiền = `bigint`, % = `numeric(7,4)` lưu tỉ lệ 0..1 · `unique(employee_id, report_date)` mỗi bảng báo cáo
  - Migration versioned (`drizzle/`), seed idempotent (`npm run db:seed`) đọc thẳng từ `src/lib/mock/`, tính lại ô tự tính bằng `computeMetrics()`
  - Verify: tổng DT Livestream 13/07 = 23.300.000 khớp UI · tồn sao xấu lũy kế = 12 · ô tự tính Sale khớp công thức
  - ✅ Đã có danh sách nhân sự thật 13 người (xem bảng trên) — seed lại xong
- [x] **P8 — Auth thật + RLS** ✅ (2026-07-16)
  - **1 tài khoản dùng chung** `sale@drkam.vn` (PM chốt) — quyền xem/sửa tất cả như Lead
  - `@supabase/ssr` + client helper cho 3 môi trường (browser / server / middleware)
  - Middleware chặn route (dùng `getUser()`, **không** dùng `getSession()` vì getSession chỉ đọc cookie → giả mạo được)
  - Login page nối auth thật · nút Đăng xuất xóa phiên · lỗi đăng nhập không tiết lộ sai email hay sai mật khẩu
  - **RLS bật cho cả 9 bảng** (`drizzle/0002_enable_rls.sql`): `authenticated` = toàn quyền · `anon` = không policy ⇒ cấm sạch
  - Verify: anon đọc → **0 dòng**, anon ghi → **401 RLS violation**, đăng nhập rồi → đọc đủ, đăng xuất → 0 dòng lại

  **🔴 2 việc BẮT BUỘC không được quên:**
  1. **P9:** kết nối Drizzle dùng user `postgres` (chủ bảng) nên **BỎ QUA RLS**. Mỗi Server Action **phải tự kiểm tra phiên đăng nhập** — quên là lỗ hổng quay lại nguyên vẹn.
  2. **P13 (chặn deploy):** đổi mật khẩu tài khoản chung trước khi lên domain thật. Vì là 1 tài khoản + toàn quyền, **mật khẩu là thứ DUY NHẤT** bảo vệ toàn bộ dữ liệu.

  **Nợ kỹ thuật:** `employees.auth_user_id` hiện để trống (tài khoản chung không ứng với 1 nhân viên cụ thể) — cột đã sẵn sàng cho khi tách tài khoản riêng. UI vẫn dùng `CURRENT_USER` mock (hiện hiện tên "Ly") → P9/P10 sẽ thay bằng phiên thật.
