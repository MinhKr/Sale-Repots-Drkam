import {
  bigint,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";

/**
 * 5 bảng báo cáo — mỗi loại tab 1 bảng, cột số RÕ RÀNG (không JSONB).
 * Lưu CẢ ô nhập tay (ô vàng) LẪN ô tự tính (ô xanh) — theo yêu cầu.
 * Ô tự tính vẫn được Server Actions tính lại mỗi lần ghi (từ ô nhập) để không lệch.
 *
 * Quy ước kiểu cột theo `kind`:
 *   int     → integer
 *   money   → bigint (VND, mode number — an toàn tới 2^53)
 *   float   → numeric (vd số giờ live)
 *   percent → numeric(7,4) — lưu TỈ LỆ 0..1 (vd 0.9012), UI *100 khi hiển thị
 *
 * Mỗi bảng: unique(employee_id, report_date) — 1 NV chỉ 1 báo cáo/ngày/tab.
 */

/** Cột số tiền VND. */
const money = (name: string) => bigint(name, { mode: "number" });
/** Cột tỉ lệ 0..1 (kind percent). */
const percent = (name: string) => numeric(name, { precision: 7, scale: 4, mode: "number" });

/* ============================ reports_sale ============================ */
export const reportsSale = pgTable(
  "reports_sale",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    reportDate: date("report_date").notNull(),

    // --- Ô nhập tay ---
    // Tương tác
    messReceived: integer("mess_received").notNull().default(0),
    messRead: integer("mess_read").notNull().default(0),
    consultCalls: integer("consult_calls").notNull().default(0),
    zaloNewFriends: integer("zalo_new_friends").notNull().default(0),
    // Đơn hàng
    newOrders: integer("new_orders").notNull().default(0),
    newOrdersRevenue: money("new_orders_revenue").notNull().default(0),
    // Ladi
    ladiCount: integer("ladi_count").notNull().default(0),
    ladiOrders: integer("ladi_orders").notNull().default(0),
    ladiRevenue: money("ladi_revenue").notNull().default(0),

    // --- Ô tự tính (lưu sẵn) ---
    tongDon: integer("tong_don").notNull().default(0),
    tongDoanhThu: money("tong_doanh_thu").notNull().default(0),
    dtTrenDon: money("dt_tren_don").notNull().default(0),
    tiLeRep: percent("ti_le_rep").notNull().default(0),
    tiLeChotLadi: percent("ti_le_chot_ladi").notNull().default(0),

    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_sale_emp_date").on(t.employeeId, t.reportDate)],
);

/* ============================ reports_cskh ============================ */
export const reportsCskh = pgTable(
  "reports_cskh",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    reportDate: date("report_date").notNull(),

    // --- Ô nhập tay ---
    // Tương tác (care_calls = "Cuộc gọi đi" — giữ tên cột cũ để không mất dữ liệu)
    messReceived: integer("mess_received").notNull().default(0),
    messSent: integer("mess_sent").notNull().default(0),
    careCalls: integer("care_calls").notNull().default(0),
    zaloNewFriends: integer("zalo_new_friends").notNull().default(0),
    customerReplies: integer("customer_replies").notNull().default(0),
    /** @deprecated Bỏ khỏi form 2026-07-20 (trùng ý "Khách phản hồi").
     *  GIỮ cột để không mất dữ liệu lịch sử; không còn được ghi ở bản mới. */
    messReplied: integer("mess_replied").notNull().default(0),
    // Đơn hàng
    reorderCount: integer("reorder_count").notNull().default(0),
    reorderRevenue: money("reorder_revenue").notNull().default(0),
    upsellCount: integer("upsell_count").notNull().default(0),
    upsellRevenue: money("upsell_revenue").notNull().default(0),
    // Chăm sóc
    complaintsResolved: integer("complaints_resolved").notNull().default(0),

    // --- Ô tự tính (lưu sẵn) ---
    tongDon: integer("tong_don").notNull().default(0),
    tongDoanhThu: money("tong_doanh_thu").notNull().default(0),
    dtTrenDon: money("dt_tren_don").notNull().default(0),
    tiLePhanHoi: percent("ti_le_phan_hoi").notNull().default(0),

    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_cskh_emp_date").on(t.employeeId, t.reportDate)],
);

/* ========================= reports_bad_review ========================= */
// Tab "Sao Xấu" — CSKH nhập. Tồn lũy kế = Σ(new_bad - resolved) tính khi hiển thị.
export const reportsBadReview = pgTable(
  "reports_bad_review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    reportDate: date("report_date").notNull(),

    // --- Ô nhập tay ---
    // Phát sinh
    newBad: integer("new_bad").notNull().default(0),
    resolved: integer("resolved").notNull().default(0),
    // Theo sàn
    shopee: integer("shopee").notNull().default(0),
    tiktok: integer("tiktok").notNull().default(0),
    lazada: integer("lazada").notNull().default(0),

    // --- Ô tự tính (lưu sẵn) ---
    tonNgay: integer("ton_ngay").notNull().default(0),
    tiLeXuLy: percent("ti_le_xu_ly").notNull().default(0),

    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_bad_emp_date").on(t.employeeId, t.reportDate)],
);

/* ========================= reports_livestream ========================= */
export const reportsLivestream = pgTable(
  "reports_livestream",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    reportDate: date("report_date").notNull(),

    // --- Ô nhập tay ---
    // Phiên live
    sessions: integer("sessions").notNull().default(0),
    hours: numeric("hours", { precision: 6, scale: 2, mode: "number" }).notNull().default(0),
    // Kết quả
    buyers: integer("buyers").notNull().default(0),
    revenue: money("revenue").notNull().default(0),

    // --- Ô tự tính (lưu sẵn) ---
    dtTrenGio: money("dt_tren_gio").notNull().default(0),
    dtTrenNguoiMua: money("dt_tren_nguoi_mua").notNull().default(0),

    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_live_emp_date").on(t.employeeId, t.reportDate)],
);

/* ========================= reports_marketing ========================= */
export const reportsMarketing = pgTable(
  "reports_marketing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    reportDate: date("report_date").notNull(),

    // --- Ô nhập tay ---
    // Chi phí
    adSpend: money("ad_spend").notNull().default(0),
    // Hiệu quả
    reach: integer("reach").notNull().default(0),
    messages: integer("messages").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    // Kết quả
    revenue: money("revenue").notNull().default(0),

    // --- Ô tự tính (lưu sẵn) ---
    cpl: money("cpl").notNull().default(0),
    cpm: money("cpm").notNull().default(0),
    roas: percent("roas").notNull().default(0),

    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_mkt_emp_date").on(t.employeeId, t.reportDate)],
);

export type ReportSale = typeof reportsSale.$inferSelect;
export type ReportCskh = typeof reportsCskh.$inferSelect;
export type ReportBadReview = typeof reportsBadReview.$inferSelect;
export type ReportLivestream = typeof reportsLivestream.$inferSelect;
export type ReportMarketing = typeof reportsMarketing.$inferSelect;
