import type { DeptCode, ReportTab } from "./types";

/** Kiểu ô hiển thị / định dạng giá trị */
export type ValueKind = "int" | "money" | "percent" | "float";

/** Ô nhập tay (ô vàng) */
export interface InputField {
  key: string;
  label: string;
  kind: "int" | "money" | "float";
  /** nhóm để bố cục form (vd "Tương tác", "Đơn hàng") */
  group: string;
}

/** Cảnh báo tồn lũy kế theo ngưỡng (tab Sao Xấu) */
export interface BacklogConfig {
  /** nhãn khi xem TẤT CẢ các kỳ — lúc đó mới thật sự là lũy kế */
  label: string;
  /** nhãn khi đang lọc theo 1 kỳ; ghép thành "<periodLabel> · tháng 08/2026" */
  periodLabel?: string;
  unit: string;
  /** ngưỡng cảnh báo ĐỎ — tồn lũy kế ≥ ngưỡng này thì báo đỏ */
  threshold: number;
  /** ngưỡng cảnh báo VÀNG — từ mức này đến ngưỡng đỏ thì báo vàng */
  warnThreshold: number;
  /** net phát sinh trong 1 dòng (vd sao xấu mới - đã xử lý) */
  net: (v: Record<string, number>) => number;
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

/** Ô nhập CHỮ (vàng) — link, nguyên nhân… lưu text chứ không phải số */
export interface TextField {
  key: string;
  label: string;
  placeholder?: string;
  /** ô nhiều dòng (textarea) thay vì 1 dòng */
  multiline?: boolean;
}

export interface ReportConfig {
  tab: ReportTab;
  title: string;
  /** Bộ phận được phép nhập tab này (dùng cho selector nhân viên) */
  allowedDepts: DeptCode[];
  /**
   * Nhân viên chọn sẵn khi MỞ FORM TẠO MỚI (id trong EMPLOYEES).
   * Chỉ áp dụng nếu người đang đăng nhập được phép nhập hộ người này; không
   * thì rơi về người đầu danh sách như cũ. Sửa dòng cũ thì luôn giữ đúng
   * nhân viên của dòng đó.
   */
  defaultEmployeeId?: string;
  inputs: InputField[];
  /** Ô nhập chữ (nếu có) — hiện dưới các ô số trong form */
  textInputs?: TextField[];
  computed: ComputedField[];
  /** Các cột số liệu (ngoài Nhân viên/Ngày) hiển thị ở bảng */
  tableMetrics: TableMetric[];
  /** Nhãn riêng cho ô Ghi chú (mặc định "Ghi chú") */
  noteLabel?: string;
  /** Nếu có: hiển thị khối cảnh báo tồn lũy kế trên bảng (Sao Xấu) */
  backlog?: BacklogConfig;
}

/** Một dòng báo cáo (mock) — chỉ lưu giá trị ô nhập; ô tự tính suy ra khi hiển thị */
export interface ReportRow {
  id: string;
  employeeId: string;
  /** ISO yyyy-mm-dd */
  date: string;
  values: Record<string, number>;
  /** Giá trị các ô nhập chữ (config.textInputs) */
  texts?: Record<string, string>;
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
  allowedDepts: ["SALE", "ADMIN", "LEAD"],
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
  allowedDepts: ["CSKH", "ADMIN", "LEAD"],
  inputs: [
    { key: "messReceived", label: "Tin nhắn nhận", kind: "int", group: "Tương tác" },
    { key: "messSent", label: "Tin nhắn gửi đi", kind: "int", group: "Tương tác" },
    { key: "careCalls", label: "Cuộc gọi đi", kind: "int", group: "Tương tác" },
    { key: "zaloNewFriends", label: "Kết bạn Zalo", kind: "int", group: "Tương tác" },
    { key: "customerReplies", label: "Khách phản hồi", kind: "int", group: "Tương tác" },
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
      // Hiệu quả tiếp cận chủ động: khách phản hồi / tổng lượt chủ động liên hệ
      key: "tiLePhanHoi",
      label: "Tỉ lệ phản hồi",
      kind: "percent",
      compute: (v) => ratio(v.customerReplies, v.messSent + v.careCalls),
    },
  ],
  tableMetrics: [
    { key: "tongDon", label: "Tổng đơn", kind: "int" },
    { key: "tongDoanhThu", label: "Doanh thu", kind: "money" },
    { key: "tiLePhanHoi", label: "Tỉ lệ phản hồi", kind: "percent" },
  ],
};

/* ============================ TAB SAO XẤU ============================ */
// reports_bad_review — CSKH có thể nhập. Có khối cảnh báo tồn lũy kế theo ngưỡng.

export const SAO_XAU_CONFIG: ReportConfig = {
  tab: "SAO_XAU",
  title: "Sao Xấu",
  allowedDepts: ["CSKH", "ADMIN", "LEAD"],
  // Hương là người phụ trách Sao Xấu (khách chốt 2026-08-20) — chọn sẵn cho
  // đỡ phải bấm mỗi lần nhập.
  defaultEmployeeId: "cskh-huong",
  // Bộ ô nhập bám theo sheet "Nhập liệu ngày" của khách (7/2026).
  inputs: [
    { key: "newBad", label: "Sao xấu mới", kind: "int", group: "Phát sinh" },
    // Chỉ nhập số case LẤY ĐƯỢC SĐT trên sàn; phần còn lại của "Sao xấu mới"
    // ngầm hiểu là không có SĐT (ô xanh "Không có SĐT" tự tính bên dưới).
    { key: "newBadWithPhone", label: "Khách có SĐT", kind: "int", group: "Phát sinh" },
    { key: "resolved", label: "Đã xử lý / gỡ", kind: "int", group: "Phát sinh" },
    { key: "star1", label: "1★", kind: "int", group: "Phân loại sao" },
    { key: "star2", label: "2★", kind: "int", group: "Phân loại sao" },
    { key: "star3", label: "3★", kind: "int", group: "Phân loại sao" },
    { key: "shopee", label: "Shopee", kind: "int", group: "Nguồn phát sinh" },
    { key: "tiktok", label: "TikTok", kind: "int", group: "Nguồn phát sinh" },
    { key: "fixed5Shopee", label: "Shopee", kind: "int", group: "Sao khách đã sửa 5★" },
    { key: "fixed5Tiktok", label: "TikTok", kind: "int", group: "Sao khách đã sửa 5★" },
    { key: "pendingShopee", label: "Shopee", kind: "int", group: "Chờ khách sửa" },
    { key: "pendingTiktok", label: "TikTok", kind: "int", group: "Chờ khách sửa" },
    { key: "warehouseIssue", label: "Vấn đề kho", kind: "int", group: "Phân loại vấn đề" },
    { key: "productEfficacy", label: "Hiệu quả SP", kind: "int", group: "Phân loại vấn đề" },
    { key: "productDefect", label: "Lỗi SP", kind: "int", group: "Phân loại vấn đề" },
  ],
  textInputs: [
    {
      key: "reviewLink",
      label: "Link đánh giá",
      placeholder: "Dán link đánh giá (nếu có)",
    },
    {
      key: "rootCause",
      label: "Nguyên nhân chính",
      placeholder: "vd: sản phẩm không như mô tả, shipper không giao tận nhà…",
      multiline: true,
    },
  ],
  noteLabel: "Ghi chú xử lý",
  computed: [
    { key: "tonNgay", label: "Tồn trong ngày", kind: "int", compute: (v) => v.newBad - v.resolved },
    {
      key: "newBadNoPhone",
      label: "Khách không có SĐT",
      kind: "int",
      // Kẹp về 0: nếu lỡ nhập "có SĐT" nhiều hơn "sao xấu mới" thì hiện 0 chứ
      // không hiện số âm (zod cũng chặn ở server, đây là lớp phòng thủ thứ 2).
      compute: (v) => Math.max(v.newBad - v.newBadWithPhone, 0),
    },
    {
      key: "tiLeXuLy",
      label: "Tỉ lệ xử lý",
      kind: "percent",
      compute: (v) => ratio(v.resolved, v.newBad),
    },
    {
      key: "fixed5Total",
      label: "Sao sửa 5★ tổng",
      kind: "int",
      compute: (v) => v.fixed5Shopee + v.fixed5Tiktok,
    },
    {
      key: "pendingTotal",
      label: "Chờ KH sửa tổng",
      kind: "int",
      compute: (v) => v.pendingShopee + v.pendingTiktok,
    },
  ],
  tableMetrics: [
    { key: "newBad", label: "Sao xấu mới", kind: "int" },
    { key: "newBadWithPhone", label: "Có SĐT", kind: "int" },
    { key: "resolved", label: "Đã xử lý", kind: "int" },
    { key: "tonNgay", label: "Tồn/ngày", kind: "int" },
    { key: "fixed5Total", label: "Sửa 5★", kind: "int" },
    { key: "pendingTotal", label: "Chờ sửa", kind: "int" },
    { key: "productEfficacy", label: "Hiệu quả SP", kind: "int" },
    { key: "productDefect", label: "Lỗi SP", kind: "int" },
  ],
  backlog: {
    label: "Tồn sao xấu lũy kế",
    periodLabel: "Tồn sao xấu",
    unit: "sao xấu",
    // Ngưỡng lấy theo sheet "KPI & Cấu hình" của khách (ĐỎ 50 · VÀNG 30)
    threshold: 50,
    warnThreshold: 30,
    net: (v) => v.newBad - v.resolved,
  },
};

/** Mục tiêu tỉ lệ xử lý sao xấu — sheet "KPI & Cấu hình": tối thiểu 80%. */
export const SAO_XAU_GOAL_TI_LE_XU_LY = 0.8;

/* ============================ TAB LIVESTREAM ============================ */
// reports_livestream — Lead nhập hộ (bulk 6 dòng). Fields theo ví dụ bulk trong kế hoạch.

export const LIVESTREAM_CONFIG: ReportConfig = {
  tab: "LIVESTREAM",
  title: "Livestream",
  allowedDepts: ["LIVESTREAM", "ADMIN", "LEAD"],
  inputs: [
    { key: "sessions", label: "Số phiên", kind: "int", group: "Phiên live" },
    { key: "hours", label: "Số giờ live", kind: "float", group: "Phiên live" },
    { key: "buyers", label: "Người mua", kind: "int", group: "Kết quả" },
    { key: "revenue", label: "Doanh thu", kind: "money", group: "Kết quả" },
  ],
  computed: [
    {
      key: "dtTrenGio",
      label: "DT / giờ",
      kind: "money",
      compute: (v) => Math.round(ratio(v.revenue, v.hours)),
    },
    {
      key: "dtTrenNguoiMua",
      label: "DT / người mua",
      kind: "money",
      compute: (v) => Math.round(ratio(v.revenue, v.buyers)),
    },
  ],
  tableMetrics: [
    { key: "hours", label: "Giờ live", kind: "float" },
    { key: "buyers", label: "Người mua", kind: "int" },
    { key: "revenue", label: "Doanh thu", kind: "money" },
    { key: "dtTrenGio", label: "DT/giờ", kind: "money" },
    { key: "dtTrenNguoiMua", label: "DT/khách", kind: "money" },
  ],
};

/** Registry config theo tab — dùng ở client để tránh truyền hàm qua ranh giới server/client */
export const CONFIG_BY_TAB = {
  SALE: SALE_CONFIG,
  CSKH: CSKH_CONFIG,
  SAO_XAU: SAO_XAU_CONFIG,
  LIVESTREAM: LIVESTREAM_CONFIG,
} as const;

export type ConfigTab = keyof typeof CONFIG_BY_TAB;

/** Tính toàn bộ ô tự tính từ giá trị ô nhập (theo thứ tự khai báo). */
export function computeMetrics(
  config: ReportConfig,
  values: Record<string, number>,
): Record<string, number> {
  // Mọi ô nhập phải có mặt (mặc định 0) — dòng cũ lưu trước khi thêm ô mới sẽ
  // thiếu key, để undefined lọt vào compute() là ra NaN.
  const acc: Record<string, number> = { ...emptyValues(config), ...values };
  for (const f of config.computed) {
    const n = f.compute(acc);
    acc[f.key] = Number.isFinite(n) ? n : 0;
  }
  return acc;
}

/** Giá trị mặc định (0) cho tất cả ô nhập của một config. */
export function emptyValues(config: ReportConfig): Record<string, number> {
  return Object.fromEntries(config.inputs.map((f) => [f.key, 0]));
}

/** Giá trị rỗng cho các ô nhập chữ của 1 tab. */
export function emptyTexts(config: ReportConfig): Record<string, string> {
  return Object.fromEntries((config.textInputs ?? []).map((f) => [f.key, ""]));
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
    values: { messReceived: 88, messSent: 120, careCalls: 31, zaloNewFriends: 14, customerReplies: 85, reorderCount: 12, reorderRevenue: 16_800_000, upsellCount: 4, upsellRevenue: 6_300_000, complaintsResolved: 2 },
    note: "2 khiếu nại đổi hàng đã xử lý xong.",
  },
  {
    id: "c-2",
    employeeId: "cskh-phuong",
    date: "2026-07-13",
    values: { messReceived: 74, messSent: 95, careCalls: 22, zaloNewFriends: 9, customerReplies: 66, reorderCount: 8, reorderRevenue: 10_400_000, upsellCount: 3, upsellRevenue: 4_100_000, complaintsResolved: 1 },
  },
  {
    id: "c-3",
    employeeId: "cskh-chinh",
    date: "2026-07-13",
    values: { messReceived: 61, messSent: 78, careCalls: 17, zaloNewFriends: 6, customerReplies: 48, reorderCount: 5, reorderRevenue: 6_900_000, upsellCount: 1, upsellRevenue: 1_500_000, complaintsResolved: 0 },
  },
  {
    id: "c-4",
    employeeId: "cskh-huong",
    date: "2026-07-12",
    values: { messReceived: 79, messSent: 102, careCalls: 26, zaloNewFriends: 11, customerReplies: 71, reorderCount: 10, reorderRevenue: 13_200_000, upsellCount: 2, upsellRevenue: 2_800_000, complaintsResolved: 1 },
  },
];

// Tồn lũy kế = Σ(newBad - resolved) = 4 + 4 + 4 = 12
export const SAO_XAU_SEED: ReportRow[] = [
  {
    id: "x-1",
    employeeId: "cskh-huong",
    date: "2026-07-13",
    values: { newBad: 7, resolved: 3, shopee: 4, tiktok: 3 },
    note: "Đang khiếu nại 2 đơn TikTok Shop.",
  },
  {
    id: "x-2",
    employeeId: "cskh-phuong",
    date: "2026-07-12",
    values: { newBad: 6, resolved: 2, shopee: 3, tiktok: 3 },
  },
  {
    id: "x-3",
    employeeId: "cskh-chinh",
    date: "2026-07-11",
    values: { newBad: 5, resolved: 1, shopee: 3, tiktok: 2 },
  },
];

export const LIVESTREAM_SEED: ReportRow[] = [
  // Ngày 13/07
  { id: "l-1", employeeId: "live-thu", date: "2026-07-13", values: { sessions: 2, hours: 4.5, buyers: 120, revenue: 5_000_000 } },
  { id: "l-2", employeeId: "live-thuy-mn", date: "2026-07-13", values: { sessions: 1, hours: 3, buyers: 80, revenue: 3_200_000 } },
  { id: "l-3", employeeId: "live-trang-mn", date: "2026-07-13", values: { sessions: 2, hours: 5, buyers: 140, revenue: 6_100_000 } },
  { id: "l-4", employeeId: "live-vy-mn", date: "2026-07-13", values: { sessions: 1, hours: 2.5, buyers: 45, revenue: 1_800_000 } },
  { id: "l-5", employeeId: "live-thuy", date: "2026-07-13", values: { sessions: 2, hours: 4, buyers: 95, revenue: 4_300_000 } },
  { id: "l-6", employeeId: "live-binh", date: "2026-07-13", values: { sessions: 1, hours: 3.5, buyers: 70, revenue: 2_900_000 } },
  // Ngày 12/07
  { id: "l-7", employeeId: "live-thu", date: "2026-07-12", values: { sessions: 1, hours: 3.5, buyers: 95, revenue: 4_100_000 } },
  { id: "l-8", employeeId: "live-thuy-mn", date: "2026-07-12", values: { sessions: 2, hours: 4, buyers: 110, revenue: 4_600_000 } },
  { id: "l-9", employeeId: "live-trang-mn", date: "2026-07-12", values: { sessions: 1, hours: 3, buyers: 88, revenue: 3_500_000 } },
  { id: "l-10", employeeId: "live-vy-mn", date: "2026-07-12", values: { sessions: 1, hours: 2, buyers: 38, revenue: 1_400_000 } },
  { id: "l-11", employeeId: "live-thuy", date: "2026-07-12", values: { sessions: 2, hours: 4.5, buyers: 105, revenue: 4_800_000 } },
  { id: "l-12", employeeId: "live-binh", date: "2026-07-12", values: { sessions: 1, hours: 3, buyers: 60, revenue: 2_400_000 } },
];
