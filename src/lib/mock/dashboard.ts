import type { KpiStatus, RankRow, RevenuePoint } from "./types";
import { EMPLOYEES } from "./employees";

/** Suy ra trạng thái KPI từ tiến độ đạt mục tiêu */
export function statusFromProgress(progress: number): KpiStatus {
  if (progress >= 1) return "dat";
  if (progress >= 0.8) return "gan-dat";
  if (progress > 0) return "yeu";
  return "chua-nhap";
}

export const KPI_STATUS_LABEL: Record<KpiStatus, string> = {
  dat: "Đạt",
  "gan-dat": "Gần đạt",
  yeu: "Yếu",
  "chua-nhap": "Chưa nhập",
};

/** Tổng quan doanh thu team (mock) */
export const TEAM_SUMMARY = {
  homQua: { value: 48_500_000, deltaVsTruoc: 0.124 },
  tuanNay: { value: 312_800_000, deltaVsTruoc: -0.043 },
  thangNay: { value: 1_284_600_000, deltaVsTruoc: 0.086 },
  mucTieuThang: 1_500_000_000,
};

/** Doanh thu 14 ngày gần nhất (mock, tất định) */
export const REVENUE_14D: RevenuePoint[] = [
  { label: "30/06", doanhThu: 41_200_000, mucTieu: 50_000_000 },
  { label: "01/07", doanhThu: 52_800_000, mucTieu: 50_000_000 },
  { label: "02/07", doanhThu: 47_100_000, mucTieu: 50_000_000 },
  { label: "03/07", doanhThu: 61_400_000, mucTieu: 50_000_000 },
  { label: "04/07", doanhThu: 38_900_000, mucTieu: 50_000_000 },
  { label: "05/07", doanhThu: 44_600_000, mucTieu: 50_000_000 },
  { label: "06/07", doanhThu: 55_300_000, mucTieu: 50_000_000 },
  { label: "07/07", doanhThu: 49_800_000, mucTieu: 50_000_000 },
  { label: "08/07", doanhThu: 58_700_000, mucTieu: 50_000_000 },
  { label: "09/07", doanhThu: 43_200_000, mucTieu: 50_000_000 },
  { label: "10/07", doanhThu: 51_900_000, mucTieu: 50_000_000 },
  { label: "11/07", doanhThu: 46_500_000, mucTieu: 50_000_000 },
  { label: "12/07", doanhThu: 63_100_000, mucTieu: 50_000_000 },
  { label: "13/07", doanhThu: 48_500_000, mucTieu: 50_000_000 },
];

/** Doanh thu tháng theo từng nhân viên (mock) — cặp [employeeId, revenue, target] */
const REVENUE_BY_EMP: Array<[string, number, number]> = [
  ["sale-phuong", 268_400_000, 220_000_000],
  ["cskh-phuong", 142_600_000, 150_000_000],
  ["cskh-chinh", 118_900_000, 150_000_000],
  ["cskh-huong", 165_300_000, 150_000_000],
  ["live-thu", 96_800_000, 90_000_000],
  ["live-thuy-mn", 74_500_000, 90_000_000],
  ["live-trang-mn", 88_200_000, 90_000_000],
  ["live-vy-mn", 41_700_000, 90_000_000],
  ["live-thuy", 79_600_000, 90_000_000],
  ["live-binh", 0, 90_000_000],
  // Diệu Linh: NV mới, chưa có số liệu — để trống tới khi nhập thật (badge "Chưa nhập")
  ["live-dieu-linh", 0, 90_000_000],
  ["mkt-ha", 63_300_000, 60_000_000],
];

/** Bảng xếp hạng nhân viên theo doanh thu tháng (đã sort giảm dần) */
/** Số liệu KPI cá nhân của 1 nhân viên (từ ranking) */
export function getPersonalStats(employeeId: string) {
  const row = RANKING.find((r) => r.employeeId === employeeId);
  if (!row) return null;
  return {
    ...row,
    total: RANKING.length,
  };
}

/** Danh sách NV có trong bảng xếp hạng (dùng cho selector dashboard cá nhân) */
export function rankedEmployeeIds(): string[] {
  return RANKING.map((r) => r.employeeId);
}

// Hệ số dao động doanh thu theo ngày (tất định) — tái dùng cho mọi NV
const DAILY_FACTORS = [
  0.8, 1.1, 0.95, 1.2, 0.7, 0.9, 1.05, 1.0, 1.15, 0.85, 1.0, 0.9, 1.25, 0.95,
];

/** Chuỗi doanh thu 14 ngày của 1 nhân viên (mock, suy từ doanh thu tháng) */
export function getPersonalSeries(employeeId: string): RevenuePoint[] {
  const row = RANKING.find((r) => r.employeeId === employeeId);
  const revenue = row?.revenue ?? 0;
  const target = row?.target ?? 0;
  const dailyBase = revenue / 26;
  const dailyTarget = Math.round(target / 26);
  return REVENUE_14D.map((p, i) => ({
    label: p.label,
    doanhThu: Math.round(dailyBase * DAILY_FACTORS[i]),
    mucTieu: dailyTarget,
  }));
}

export const RANKING: RankRow[] = REVENUE_BY_EMP.map(([employeeId, revenue, target]) => {
  const emp = EMPLOYEES.find((e) => e.id === employeeId)!;
  const progress = target > 0 ? revenue / target : 0;
  return {
    rank: 0,
    employeeId,
    name: emp.shortName,
    dept: emp.dept,
    revenue,
    target,
    progress,
    status: statusFromProgress(progress),
  };
})
  .sort((a, b) => b.revenue - a.revenue)
  .map((row, i) => ({ ...row, rank: i + 1 }));
