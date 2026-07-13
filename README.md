# Sales Report DrKam

Hệ thống báo cáo phòng Sale DrKam — web nội bộ thay thế các file Excel/Google Sheet mà phòng Sale đang dùng để theo dõi báo cáo hàng ngày.

- **Sản phẩm:** https://sales.drkam.vn
- **Chủ dự án:** Anh Kam — CEO DrKam (Công ty CP The Famidoc Việt Nam)
- **Quy mô:** ~15 người dùng (11 nhân viên + Lead kiêm BGĐ)
- **Tài liệu:** `KE_HOACH_DEV_SALES_REPORT_DRKAM.docx` (DEV-PLAN-01/DA-SR-2026)

## Tech stack

| Tầng | Công nghệ |
|------|-----------|
| Framework | Next.js 15 (App Router, TypeScript strict, Server Actions) |
| UI | Tailwind CSS + shadcn/ui + Recharts + Lucide React |
| Database + Auth | Supabase (PostgreSQL 16, Auth email/password, Storage, RLS) |
| ORM | Drizzle ORM |
| Xuất báo cáo | exceljs (.xlsx), docx (.docx) |
| Hosting | Vercel (auto SSL, CDN, deploy on push) |

## Phạm vi (giai đoạn 1)

11 màn hình: Đăng nhập, Trang chủ, 5 tab bộ phận (Sale, CSKH, Sao Xấu, Livestream, MKT), Dashboard cá nhân, Pipeline khách sỉ, Cấu hình KPI, Xuất báo cáo. Database 11 bảng bảo vệ bằng Row Level Security.

## Sprint plan (5 tuần)

1. **Tuần 1** — Setup + Auth + Design system + DB schema (11 bảng)
2. **Tuần 2** — Trang chủ + Dashboard team + 3 tab (Sale, CSKH, Sao Xấu)
3. **Tuần 3** — 2 tab (Livestream, MKT) + Dashboard cá nhân
4. **Tuần 4** — Pipeline khách sỉ + Cấu hình KPI + Xuất Excel/Word
5. **Tuần 5** — Testing + UAT + Deploy (custom domain) + Training + Bàn giao

## Getting started

> Đang ở giai đoạn khởi tạo (Sprint 1).

```bash
npm install
npm run dev
```

## Biến môi trường

Tạo file `.env.local` (không commit) với các biến Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```
