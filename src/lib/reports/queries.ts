import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  CONFIG_BY_TAB,
  type ConfigTab,
  type ReportRow,
} from "@/lib/mock/reports";
import { reportTable } from "./shared";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Đọc toàn bộ báo cáo 1 tab, trả ReportRow[] (employeeId = slug) cho UI.
 *
 * Hiệu năng: **1 round-trip DB duy nhất** — JOIN thẳng sang `employees` để lấy
 * `code` (slug), thay vì trước đây nạp bảng nhân viên rồi mới query báo cáo (2 lượt).
 *
 * KHÔNG gọi `getUser()` ở đây: middleware (matcher phủ mọi route) đã xác thực
 * phiên bằng `getUser()` cho chính request này TRƯỚC khi page render — gọi lại
 * là round-trip mạng thừa. Đường GHI (actions.ts) vẫn tự kiểm tra phiên vì
 * Server Action có thể bị gọi trực tiếp và Drizzle bỏ qua RLS.
 */
export async function listReports(
  tab: ConfigTab,
  /**
   * Giới hạn theo uuid nhân viên được XEM (lib/reports/guard.ts tính ra).
   * Bỏ trống = không giới hạn (Lead/Admin/tài khoản chung).
   * Mảng RỖNG = không thấy gì — trả về [] luôn, không truy vấn.
   */
  visibleIds?: string[],
): Promise<ReportRow[]> {
  if (visibleIds && visibleIds.length === 0) return [];

  const table = reportTable(tab);
  const config = CONFIG_BY_TAB[tab];

  const q = db
    .select({ report: table, code: schema.employees.code })
    .from(table)
    .leftJoin(schema.employees, eq(table.employeeId, schema.employees.id));

  const rows: { report: Record<string, any>; code: string | null }[] =
    await (visibleIds
      ? q.where(inArray(table.employeeId, visibleIds))
      : q
    ).orderBy(desc(table.reportDate));

  return rows.map(({ report, code }) => {
    const values: Record<string, number> = {};
    for (const f of config.inputs) values[f.key] = Number(report[f.key] ?? 0);
    const texts: Record<string, string> = {};
    for (const t of config.textInputs ?? [])
      texts[t.key] = (report[t.key] as string | null) ?? "";
    return {
      id: report.id as string,
      employeeId: code ?? (report.employeeId as string),
      date: report.reportDate as string,
      values,
      texts: config.textInputs?.length ? texts : undefined,
      note: (report.note as string | null) ?? undefined,
    };
  });
}
