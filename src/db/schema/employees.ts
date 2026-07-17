import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { deptEnum, roleEnum } from "./enums";

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
  /** Tên gọi ngắn, phân biệt được — hiển thị ở bảng/dashboard */
  shortName: text("short_name").notNull(),
  dept: deptEnum("dept").notNull(),
  role: roleEnum("role").notNull().default("STAFF"),
  /** Chữ cái viết tắt cho Avatar fallback */
  initials: text("initials").notNull(),
  active: boolean("active").notNull().default(true),
  /** Liên kết Supabase Auth — điền ở P8 */
  authUserId: uuid("auth_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
