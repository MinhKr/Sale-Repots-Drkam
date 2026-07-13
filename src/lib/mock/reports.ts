import type { DeptCode, ReportTab } from "./types";

/** Kiểu ô hiển thị / định dạng giá trị */
export type ValueKind = "int" | "money" | "percent";

/** Ô nhập tay (ô vàng) */
export interface InputField {
  key: string;
  label: string;
  kind: "int" | "money";
  /** nhóm để bố cục form (vd "Tương tác", "Đơn hàng") */
  group: string;
}

/** Ô tự tính (ô xanh, readonly) — tính từ các ô nhập + ô tự tính trước đó */
export interface ComputedField {
  key: string;
  label: string;
  kind: ValueKind;
  compute: (v: Record<string, number>) => number;
}

/** Cột hiển thị trong bảng danh sách */
export interface TableMetric {
  key: string;
  label: string;
  kind: ValueKind;
}

export interface ReportConfig {
  tab: ReportTab;
  title: string;
  /** Bộ phận được phép nhập tab này (dùng cho selector nhân viên) */
  allowedDepts: DeptCode[];
  inputs: InputField[];
  computed: ComputedField[];
  /** Các cột số liệu (ngoài Nhân viên/Ngày) hiển thị ở bảng */
  tableMetrics: TableMetric[];
}

/** Một dòng báo cáo (mock) — chỉ lưu giá trị ô nhập; ô tự tính suy ra khi hiển thị */
export interface ReportRow {
  id: string;
  employeeId: string;
  /** ISO yyyy-mm-dd */
  date: string;
  values: Record<string, number>;
  note?: string;
}

/** Ngày "hôm nay" của bản demo (mock) */
export const TODAY_ISO = "2026-07-13";

/** Chia an toàn (tránh chia 0) */
const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

/* ============================ TAB SALE ============================ */
// Cột lấy đúng theo schema reports_sale trong kế hoạch dev.

export const SALE_CONFIG: ReportConfig = {
  tab: "SALE",
  title: "Sale",
  allowedDepts: ["SALE", "CSKH", "LEAD"],
  inputs: [
    { key: "messReceived", label: "Tin nhắn nhận", kind: "int", group: "Tương tác" },
    { key: "messRead", label: "Tin nhắn đã rep", kind: "int", group: "Tương tác" },
    { key: "consultCalls", label: "Cuộc gọi tư vấn", kind: "int", group: "Tương tác" },
    { key: "zaloNewFriends", label: "Kết bạn Zalo mới", kind: "int", group: "Tương tác" },
    { key: "newOrders", label: "Đơn mới", kind: "int", group: "Đơn hàng" },
    { key: "newOrdersRevenue", label: "DT đơn mới", kind: "money", group: "Đơn hàng" },
    { key: "ladiCount", label: "Số Ladi", kind: "int", group: "Ladi" },
    { key: "ladiOrders", label: "Đơn từ Ladi", kind: "int", group: "Ladi" },
    { key: "ladiRevenue", label: "DT Ladi", kind: "money", group: "Ladi" },
  ],
  computed: [
    { key: "tongDon", label: "Tổng đơn", kind: "int", compute: (v) => v.newOrders + v.ladiOrders },
    {
      key: "tongDoanhThu",
      label: "Tổng doanh thu",
      kind: "money",
      compute: (v) => v.newOrdersRevenue + v.ladiRevenue,
    },
    {
      key: "dtTrenDon",
      label: "DT / đơn",
      kind: "money",
      compute: (v) => Math.round(ratio(v.tongDoanhThu, v.tongDon)),
    },
    { key: "tiLeRep", label: "Tỉ lệ rep tin", kind: "percent", compute: (v) => ratio(v.messRead, v.messReceived) },
    {
      key: "tiLeChotLadi",
      label: "Tỉ lệ chốt Ladi",
      kind: "percent",
      compute: (v) => ratio(v.ladiOrders, v.ladiCount),
    },
  ],
  tableMetrics: [
    { key: "tongDon", label: "Tổng đơn", kind: "int" },
    { key: "tongDoanhThu", label: "Doanh thu", kind: "money" },
    { key: "tiLeRep", label: "Tỉ lệ rep", kind: "percent" },
  ],
};

/* ============================ TAB CSKH ============================ */
// Kế hoạch ghi "reports_cskh viết tương tự" — bộ chỉ số CSKH đề xuất (chăm sóc/tái mua/upsell).

export const CSKH_CONFIG: ReportConfig = {
  tab: "CSKH",
  title: "CSKH",
  allowedDepts: ["CSKH", "LEAD"],
  inputs: [
    { key: "messReceived", label: "Tin nhắn nhận", kind: "int", group: "Tương tác" },
    { key: "messReplied", label: "Tin nhắn đã phản hồi", kind: "int", group: "Tương tác" },
    { key: "careCalls", label: "Cuộc gọi chăm sóc", kind: "int", group: "Tương tác" },
    { key: "reorderCount", label: "Đơn tái mua", kind: "int", group: "Đơn hàng" },
    { key: "reorderRevenue", label: "DT tái mua", kind: "money", group: "Đơn hàng" },
    { key: "upsellCount", label: "Đơn upsell", kind: "int", group: "Đơn hàng" },
    { key: "upsellRevenue", label: "DT upsell", kind: "money", group: "Đơn hàng" },
    { key: "complaintsResolved", label: "Khiếu nại đã xử lý", kind: "int", group: "Chăm sóc" },
  ],
  computed: [
    { key: "tongDon", label: "Tổng đơn", kind: "int", compute: (v) => v.reorderCount + v.upsellCount },
    {
      key: "tongDoanhThu",
      label: "Tổng doanh thu",
      kind: "money",
      compute: (v) => v.reorderRevenue + v.upsellRevenue,
    },
    {
      key: "dtTrenDon",
      label: "DT / đơn",
      kind: "money",
      compute: (v) => Math.round(ratio(v.tongDoanhThu, v.tongDon)),
    },
    {
      key: "tiLePhanHoi",
      label: "Tỉ lệ phản hồi",
      kind: "percent",
      compute: (v) => ratio(v.messReplied, v.messReceived),
    },
  ],
  tableMetrics: [
    { key: "tongDon", label: "Tổng đơn", kind: "int" },
    { key: "tongDoanhThu", label: "Doanh thu", kind: "money" },
    { key: "tiLePhanHoi", label: "Tỉ lệ phản hồi", kind: "percent" },
  ],
};

/** Registry config theo tab — dùng ở client để tránh truyền hàm qua ranh giới server/client */
export const CONFIG_BY_TAB = {
  SALE: SALE_CONFIG,
  CSKH: CSKH_CONFIG,
} as const;

export type ConfigTab = keyof typeof CONFIG_BY_TAB;

/** Tính toàn bộ ô tự tính từ giá trị ô nhập (theo thứ tự khai báo). */
export function computeMetrics(
  config: ReportConfig,
  values: Record<string, number>,
): Record<string, number> {
  const acc: Record<string, number> = { ...values };
  for (const f of config.computed) {
    acc[f.key] = f.compute(acc);
  }
  return acc;
}

/** Giá trị mặc định (0) cho tất cả ô nhập của một config. */
export function emptyValues(config: ReportConfig): Record<string, number> {
  return Object.fromEntries(config.inputs.map((f) => [f.key, 0]));
}

/* ============================ SEED ROWS ============================ */

export const SALE_SEED: ReportRow[] = [
  {
    id: "s-1",
    employeeId: "sale-phuong",
    date: "2026-07-13",
    values: { messReceived: 142, messRead: 128, consultCalls: 24, zaloNewFriends: 12, newOrders: 9, newOrdersRevenue: 18_600_000, ladiCount: 40, ladiOrders: 7, ladiRevenue: 12_400_000 },
    note: "Chạy Ladi mẫu mới, tỉ lệ chốt tốt.",
  },
  {
    id: "s-2",
    employeeId: "sale-phuong",
    date: "2026-07-12",
    values: { messReceived: 118, messRead: 96, consultCalls: 19, zaloNewFriends: 8, newOrders: 6, newOrdersRevenue: 13_200_000, ladiCount: 33, ladiOrders: 5, ladiRevenue: 8_900_000 },
  },
  {
    id: "s-3",
    employeeId: "sale-phuong",
    date: "2026-07-11",
    values: { messReceived: 165, messRead: 150, consultCalls: 28, zaloNewFriends: 15, newOrders: 11, newOrdersRevenue: 22_800_000, ladiCount: 45, ladiOrders: 9, ladiRevenue: 15_100_000 },
  },
  {
    id: "s-4",
    employeeId: "sale-phuong",
    date: "2026-07-10",
    values: { messReceived: 97, messRead: 74, consultCalls: 14, zaloNewFriends: 5, newOrders: 4, newOrdersRevenue: 7_600_000, ladiCount: 22, ladiOrders: 3, ladiRevenue: 5_200_000 },
  },
];

export const CSKH_SEED: ReportRow[] = [
  {
    id: "c-1",
    employeeId: "cskh-huong",
    date: "2026-07-13",
    values: { messReceived: 88, messReplied: 85, careCalls: 31, reorderCount: 12, reorderRevenue: 16_800_000, upsellCount: 4, upsellRevenue: 6_300_000, complaintsResolved: 2 },
    note: "2 khiếu nại đổi hàng đã xử lý xong.",
  },
  {
    id: "c-2",
    employeeId: "cskh-phuong",
    date: "2026-07-13",
    values: { messReceived: 74, messReplied: 66, careCalls: 22, reorderCount: 8, reorderRevenue: 10_400_000, upsellCount: 3, upsellRevenue: 4_100_000, complaintsResolved: 1 },
  },
  {
    id: "c-3",
    employeeId: "cskh-chinh",
    date: "2026-07-13",
    values: { messReceived: 61, messReplied: 48, careCalls: 17, reorderCount: 5, reorderRevenue: 6_900_000, upsellCount: 1, upsellRevenue: 1_500_000, complaintsResolved: 0 },
  },
  {
    id: "c-4",
    employeeId: "cskh-huong",
    date: "2026-07-12",
    values: { messReceived: 79, messReplied: 71, careCalls: 26, reorderCount: 10, reorderRevenue: 13_200_000, upsellCount: 2, upsellRevenue: 2_800_000, complaintsResolved: 1 },
  },
];
