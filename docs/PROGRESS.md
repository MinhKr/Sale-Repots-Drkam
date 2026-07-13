# Nhật ký tiến trình — Sales Report DrKam

> Đọc file này để nắm nhanh **đã làm gì, còn gì, quyết định quan trọng**.
> Checklist chi tiết theo phiên: xem [`ROADMAP.md`](./ROADMAP.md).

## 📌 Trạng thái tổng quan

- **Giai đoạn 1 (Demo UI + mock data):** đã xong **P0 → P4** (10/11 màn có nội dung). Còn **P5** (Cấu hình KPI + Xuất báo cáo) rồi **P6** (rà soát + duyệt design).
- **Giai đoạn 2 (DB thật):** chưa bắt đầu — chỉ khởi động sau khi P6 được PM duyệt "design OK".
- **Nhánh làm việc:** `work/2026-07-13` (đã merge vào `main`).

## ✅ Đã hoàn thành (phiên 2026-07-13)

| Phiên | Nội dung | File chính |
|---|---|---|
| **P0** | Scaffold Next.js 16 + design system + app shell | `src/app/globals.css`, `src/components/shell/*`, `src/lib/mock/employees.ts`, `src/lib/nav.ts` |
| **P1** | Trang chủ Dashboard team (KPI tiles, card mục tiêu, biểu đồ 14 ngày, xếp hạng) | `src/app/(app)/home/page.tsx`, `src/components/dashboard/*` |
| **P2** | Tab Sale + CSKH (khung config-driven, form ô vàng/ô tự tính) | `src/lib/mock/reports.ts`, `src/components/reports/report-{form,tab}.tsx` |
| **P3** | Tab Sao Xấu (cảnh báo tồn lũy kế) + Livestream (bulk 6 dòng) + MKT | `src/components/reports/livestream-tab.tsx`, config trong `reports.ts` |
| **P4** | Dashboard cá nhân (LineChart) + Pipeline khách sỉ (kanban kéo-thả) | `src/components/dashboard/personal-dashboard.tsx`, `src/components/pipeline/*`, `src/lib/mock/wholesale.ts` |

## 🧭 Cách chạy & kiểm tra

```bash
npm install
npm run dev        # http://localhost:3000 → /login → Đăng nhập (mock) → /home
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

- Đăng nhập là **mock**: bấm "Đăng nhập" là vào thẳng `/home` (chưa có auth thật).
- Mọi số liệu là **dữ liệu giả** trong `src/lib/mock/`. Tên nhân viên là **tên thật** (Phượng, Hương, Lê Hoài Ly...).

## 🏗️ Kiến trúc & quyết định quan trọng

- **Stack:** Next.js **16** (App Router, TS strict) · Tailwind **v4** (CSS-first `@theme`) · shadcn/ui bản **base-nova** (dùng **Base UI**, không phải Radix) · Recharts 3 · lucide.
  - ⚠️ Base UI khác Radix: `Select.onValueChange` trả `string | null`; `DialogClose` **không** có `asChild` (dùng `onClick` + state thay thế).
- **Theme màu ĐỎ DrKam** `#D32027` — thang màu `brand/accent/gold/success/warning/danger` + `chart-1..5` khai báo trong `globals.css`. Nút xoá dùng **rose `#E11D48`** để tách khỏi đỏ chính. Xem [`design-tokens.md`](./design-tokens.md).
- **Fonts:** Montserrat (heading) · Inter (body) · JetBrains Mono (số tabular).
- **Khung báo cáo config-driven** (`reports.ts`): mỗi tab khai báo `inputs` (ô vàng), `computed` (ô tự tính, có hàm `compute`), `tableMetrics`, tùy chọn `backlog` (cảnh báo tồn). 5 tab dùng chung `ReportTab`/`ReportForm`; riêng Livestream có `LivestreamTab` (bulk).
  - ⚠️ Config chứa **hàm** → **không** truyền config từ Server Component sang Client Component (lỗi serialize). Trang chỉ truyền `tab` (string) + `initialRows` (data thuần); client tự resolve config qua `CONFIG_BY_TAB`.
- **State toàn bộ là client-side** (`useState`) — chưa có persistence. Reload là mất dữ liệu nhập thêm (đúng bản chất demo mock).
- **Pipeline kéo-thả:** dùng **native HTML5 DnD** (không thêm dnd-kit) cho nhẹ; khi sang giai đoạn thật có thể cân nhắc dnd-kit cho mobile/touch.
- **eslint/tsconfig:** đã loại thư mục `ui-ux-pro-max-skill/` (skill tra cứu design, repo git riêng, không thuộc source).

## 🎨 Skill hỗ trợ

- **UI Pro Max** (`ui-ux-pro-max-skill/`): tra cứu style/màu/typography — gọi qua
  `python src/ui-ux-pro-max/scripts/search.py "<query>" --domain <style|color|typography|chart>`.
- **dataviz** (skill Claude): đã áp cho biểu đồ (1 trục, màu từ token, mark specs, tooltip).

## ⏭️ Việc tiếp theo (P5)

1. **Cấu hình KPI:** form nhập mục tiêu KPI theo tháng cho 4 bộ phận + 11 NV + ngưỡng cảnh báo (mock). Gắn vào `src/app/(app)/kpi/page.tsx`.
2. **Xuất báo cáo:** form chọn kỳ + nội dung + định dạng (Excel/Word) — **chỉ mock nút xuất**, chưa sinh file thật. Gắn vào `src/app/(app)/export/page.tsx`.

Sau P5 là **P6**: đi hết 11 màn, rà soát responsive/spacing/màu, rồi **chốt design với PM** → mở khóa Giai đoạn 2.
