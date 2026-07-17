import {
  bigint,
  integer,
  pgTable,
  smallint,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";

/**
 * Cấu hình KPI theo tháng cho từng NV. Khớp src/lib/mock/kpi.ts.
 * Lead nhập mục tiêu doanh thu + ngưỡng cảnh báo "gần đạt".
 * unique(year, month, employee_id) — 1 dòng target / NV / tháng.
 */
export const kpiConfig = pgTable(
  "kpi_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),
    month: smallint("month").notNull(), // 1..12
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    /** Mục tiêu doanh thu tháng (VND) */
    targetRevenue: bigint("target_revenue", { mode: "number" }).notNull().default(0),
    /** Ngưỡng % coi là "gần đạt" (mặc định 80) */
    warningThreshold: smallint("warning_threshold").notNull().default(80),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_kpi_year_month_emp").on(t.year, t.month, t.employeeId)],
);

export type KpiConfig = typeof kpiConfig.$inferSelect;
export type NewKpiConfig = typeof kpiConfig.$inferInsert;
