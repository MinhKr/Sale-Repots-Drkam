import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { deptEnum, employmentEnum, regionEnum, roleEnum } from "./enums";

/**
 * Nhân sự (11 NV + Lead). Khớp src/lib/mock/employees.ts.
 *
 * id = uuid (khóa chính thật). `code` = slug ổn định (vd "sale-phuong")
 * dùng để seed & ánh xạ mock; các FK trỏ vào id (uuid).
 * authUserId (nullable) sẽ liên kết với Supabase auth.users ở P8 (Auth thật).
 */
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Slug ổn định để map mock/seed & tham chiếu ngoài (vd "sale-phuong") */
  code: text("code").unique(),
  /** Họ tên đầy đủ */
  name: text("name").notNull(),
  /**
   * Email đăng nhập (sinh từ họ tên, vd "Lê Đắc Nhật Minh" → minhldn@drkam.vn).
   * Trống = chưa cấp tài khoản. Là email của user bên Supabase Auth.
   */
  email: text("email").unique(),
  /** Tên gọi ngắn, phân biệt được — hiển thị ở bảng/dashboard */
  shortName: text("short_name").notNull(),
  dept: deptEnum("dept").notNull(),
  role: roleEnum("role").notNull().default("STAFF"),
  /** Chữ cái viết tắt cho Avatar fallback */
  initials: text("initials").notNull(),
  /**
   * Miền + loại hợp đồng — CHỈ có ý nghĩa với bộ phận Livestream, các bộ phận
   * khác để trống. Hai cột này quyết định quyền nhập báo cáo Livestream:
   * chỉ FT được nhập, và nhập hộ được các PT cùng miền (PM chốt 2026-07-31).
   */
  region: regionEnum("region"),
  employment: employmentEnum("employment"),
  active: boolean("active").notNull().default(true),
  /**
   * Liên kết tới `auth.users.id` bên Supabase Auth.
   * Trống = nhân viên chưa có tài khoản đăng nhập.
   */
  authUserId: uuid("auth_user_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
