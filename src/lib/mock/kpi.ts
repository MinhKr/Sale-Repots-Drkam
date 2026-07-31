/**
 * Mock cấu hình KPI theo tháng (bảng kpi_config: year + month + FK + target + ngưỡng).
 * Lead nhập mục tiêu doanh thu cho từng NV + ngưỡng cảnh báo "gần đạt".
 */

import type { DeptCode } from "./types";

/** Các bộ phận có KPI (Lead không có target riêng) */
export const KPI_DEPTS: DeptCode[] = ["SALE", "CSKH", "LIVESTREAM"];

/** Mục tiêu doanh thu tháng mặc định theo NV (khớp số dùng ở dashboard).
 *  Hương (cskh-huong) là Admin — không có KPI, như Lead. */
export const KPI_DEFAULT_TARGETS: Record<string, number> = {
  "sale-phuong": 220_000_000,
  "cskh-phuong": 150_000_000,
  "cskh-chinh": 150_000_000,
  "live-thu": 90_000_000,
  "live-thuy-mn": 90_000_000,
  "live-trang-mn": 90_000_000,
  "live-vy-mn": 90_000_000,
  "live-thuy": 90_000_000,
  "live-binh": 90_000_000,
  "live-dieu-linh": 90_000_000,
};

/** Mục tiêu tháng TRƯỚC (mock ~90%) — dùng cho nút "Sao chép tháng trước" */
export const KPI_PREV_MONTH_TARGETS: Record<string, number> = Object.fromEntries(
  Object.entries(KPI_DEFAULT_TARGETS).map(([id, v]) => [
    id,
    Math.round((v * 0.9) / 1_000_000) * 1_000_000,
  ]),
);

/** Ngưỡng % coi là "gần đạt" mặc định (đạt = 100%, dưới ngưỡng này = yếu) */
export const KPI_DEFAULT_WARNING = 80;

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
export const YEARS = [2025, 2026, 2027];
