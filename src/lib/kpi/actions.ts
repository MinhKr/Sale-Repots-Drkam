"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getEmployeeMaps } from "@/lib/reports/shared";

// Dùng giá trị vừa insert (EXCLUDED) khi upsert nhiều dòng cùng lúc.
const excluded = (col: string) => sql.raw(`excluded.${col}`);

const saveSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  warning: z.number().int().min(0).max(100),
  targets: z.record(z.string(), z.number().int().min(0)),
});

/**
 * Lưu cấu hình KPI 1 tháng: upsert mục tiêu + ngưỡng cho từng NV.
 * unique(year, month, employee_id) → nhập lại cùng tháng sẽ ghi đè.
 */
export async function saveKpiConfig(input: unknown): Promise<void> {
  await requireUser();
  const { year, month, warning, targets } = saveSchema.parse(input);

  const { codeToId } = await getEmployeeMaps();
  const rows = Object.entries(targets)
    .map(([code, target]) => {
      const employeeId = codeToId.get(code);
      if (!employeeId) return null;
      return {
        year,
        month,
        employeeId,
        targetRevenue: target,
        warningThreshold: warning,
        updatedAt: new Date(),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length) {
    await db
      .insert(schema.kpiConfig)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          schema.kpiConfig.year,
          schema.kpiConfig.month,
          schema.kpiConfig.employeeId,
        ],
        set: {
          targetRevenue: excluded("target_revenue"),
          warningThreshold: excluded("warning_threshold"),
          updatedAt: new Date(),
        },
      });
  }

  revalidatePath("/kpi");
  revalidatePath("/home");
  revalidatePath("/dashboard-ca-nhan");
}
