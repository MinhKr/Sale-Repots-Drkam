# Lộ trình phát triển — Sales Report DrKam

> **Bảng bám phiên làm việc.** Mỗi lần vào việc, mở file này, làm đúng 1 phiên (hoặc tiếp phiên dở), tick trạng thái khi xong.

## 🔑 Nguyên tắc quan trọng (thay đổi so với kế hoạch gốc)

1. **Design-first / fake data:** Dựng **đầy đủ toàn bộ màn hình + tab** bằng **dữ liệu giả (mock)** trước. **KHÔNG** động vào Supabase/DB/Auth thật cho tới khi design được **duyệt OK**.
2. **Tên nhân viên dùng tên thật** trong mock data (xem danh sách dưới).
3. Chốt design ✅ (Phiên 6) rồi **mới** sang Giai đoạn 2 đổ dữ liệu thật.
4. **Theme màu ĐỎ DrKam** (`#D32027`) — xem `docs/design-tokens.md`, không dùng xanh dương của kế hoạch cũ.

## 👥 Nhân sự thật (dùng cho mock data)

| Bộ phận (code) | SL | Tên nhân viên |
|---|---|---|
| Sale (`SALE`) | 1 | Phượng |
| CSKH (`CSKH`) | 3 | Phương, Chinh, Hương |
| Livestream (`LIVESTREAM`) | 6 | Thư, Thúy MN, Trang MN, Vy MN, Thủy, Bình |
| MKT (`MKT`) | 1 | Nguyễn Thị Hà |
| Lead / BGĐ | 1 | Lê Hoài Ly |

> CSKH có thể nhập cả tab **Sao Xấu**. Livestream + MKT do **Lead nhập hộ**.

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
