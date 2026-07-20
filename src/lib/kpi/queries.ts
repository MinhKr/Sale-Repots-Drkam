import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { KPI_DEFAULT_WARNING } from "@/lib/mock/kpi";

/** Cấu hình KPI 1 tháng: mục tiêu theo mã NV + ngưỡng cảnh báo. */
export interface MonthKpi {
  targets: Record<string, number>;
  warning: number;
}

/**
 * Nạp TOÀN BỘ cấu hình KPI, gom theo `${year}-${month}` (1 round-trip).
 * Client giữ selector tháng/năm và tự lọc — khỏi gọi server mỗi lần đổi tháng.
 */
export async function listKpiConfigs(): Promise<Record<string, MonthKpi>> {
  const rows = await db
    .select({
      year: schema.kpiConfig.year,
      month: schema.kpiConfig.month,
      code: schema.employees.code,
      target: schema.kpiConfig.targetRevenue,
      warning: schema.kpiConfig.warningThreshold,
    })
    .from(schema.kpiConfig)
    .leftJoin(
      schema.employees,
      eq(schema.kpiConfig.employeeId, schema.employees.id),
    );

  const out: Record<string, MonthKpi> = {};
  for (const r of rows) {
    if (!r.code) continue;
    const key = `${r.year}-${r.month}`;
    const bucket = (out[key] ??= { targets: {}, warning: KPI_DEFAULT_WARNING });
    bucket.targets[r.code] = Number(r.target ?? 0);
    bucket.warning = r.warning ?? KPI_DEFAULT_WARNING;
  }
  return out;
}
