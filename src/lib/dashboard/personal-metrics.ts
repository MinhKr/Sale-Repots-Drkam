import { and, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  computeMetrics,
  CONFIG_BY_TAB,
  type ConfigTab,
} from "@/lib/mock/reports";
import { reportTable } from "@/lib/reports/shared";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tổng hợp ĐẦY ĐỦ chỉ số của nhân viên trong 1 tháng, theo đúng bộ chỉ số của
 * tab họ nhập (PM yêu cầu 2026-07-31c).
 *
 * Cách tính: **cộng dồn các ô nhập rồi mới tính lại ô tự tính** từ tổng đó —
 * KHÔNG lấy trung bình các ô tự tính theo ngày. Ví dụ tỉ lệ rep cả tháng phải
 * là (tổng tin đã rep / tổng tin nhận); trung bình cộng tỉ lệ từng ngày sẽ ra
 * số sai khi các ngày chênh lệch lượng tin.
 *
 * Hiệu năng: đúng **4 truy vấn** (mỗi tab 1 lượt) cho dù bao nhiêu nhân viên,
 * rồi gom nhóm trong JS — không query theo từng người.
 */

export interface MetricValue {
  key: string;
  label: string;
  kind: "int" | "money" | "percent" | "float";
  value: number;
  /** true = ô tự tính (dẫn xuất), false = ô nhập tay */
  computed: boolean;
}

export interface MetricGroup {
  tab: ConfigTab;
  /** Tên tab, vd "Sale" */
  title: string;
  /** Số báo cáo đã nhập trong tháng */
  reportCount: number;
  metrics: MetricValue[];
}

/** uuid nhân viên → các khối chỉ số theo tab */
export type MetricsByEmployee = Record<string, MetricGroup[]>;

const ALL_TABS: ConfigTab[] = ["SALE", "CSKH", "SAO_XAU", "LIVESTREAM"];

/** Ngày đầu và cuối của tháng "yyyy-mm". */
function monthRange(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(last).padStart(2, "0")}`];
}

export async function getPersonalMetrics(
  employeeUuids: string[],
  month: string | null,
): Promise<MetricsByEmployee> {
  const out: MetricsByEmployee = {};
  if (!month || employeeUuids.length === 0) return out;
  const [from, to] = monthRange(month);

  const perTab = await Promise.all(
    ALL_TABS.map(async (tab) => {
      const table = reportTable(tab);
      const rows: Record<string, any>[] = await db
        .select()
        .from(table)
        .where(
          and(
            inArray(table.employeeId, employeeUuids),
            gte(table.reportDate, from),
            lte(table.reportDate, to),
          ),
        );
      return { tab, rows };
    }),
  );

  for (const { tab, rows } of perTab) {
    const config = CONFIG_BY_TAB[tab];

    // Gom theo nhân viên rồi cộng dồn ô nhập
    const sumsByEmp = new Map<string, Record<string, number>>();
    const countByEmp = new Map<string, number>();
    for (const r of rows) {
      const id = r.employeeId as string;
      let sums = sumsByEmp.get(id);
      if (!sums) {
        sums = Object.fromEntries(config.inputs.map((f) => [f.key, 0]));
        sumsByEmp.set(id, sums);
      }
      for (const f of config.inputs) sums[f.key] += Number(r[f.key] ?? 0);
      countByEmp.set(id, (countByEmp.get(id) ?? 0) + 1);
    }

    for (const [id, sums] of sumsByEmp) {
      // Tính lại ô tự tính TỪ TỔNG (không phải trung bình theo ngày)
      const full = computeMetrics(config, sums);
      const metrics: MetricValue[] = [
        ...config.inputs.map((f) => ({
          key: f.key,
          label: f.label,
          kind: f.kind,
          value: sums[f.key] ?? 0,
          computed: false,
        })),
        ...config.computed.map((f) => ({
          key: f.key,
          label: f.label,
          kind: f.kind,
          value: full[f.key] ?? 0,
          computed: true,
        })),
      ];
      (out[id] ??= []).push({
        tab,
        title: config.title,
        reportCount: countByEmp.get(id) ?? 0,
        metrics,
      });
    }
  }

  return out;
}
