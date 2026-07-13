/**
 * Kiểu dữ liệu domain dùng chung cho toàn app (giai đoạn mock).
 * Khi sang Giai đoạn 2 (DB thật) sẽ ánh xạ 1-1 sang schema Drizzle.
 */

/** Bộ phận biên chế nhân sự */
export type DeptCode = "SALE" | "CSKH" | "LIVESTREAM" | "MKT" | "LEAD";

/** 5 loại tab báo cáo (Sao Xấu là loại báo cáo, không phải bộ phận) */
export type ReportTab = "SALE" | "CSKH" | "SAO_XAU" | "LIVESTREAM" | "MKT";

export type Role = "STAFF" | "LEAD";

export interface Employee {
  id: string;
  name: string;
  dept: DeptCode;
  role: Role;
  /** Chữ cái viết tắt cho Avatar fallback */
  initials: string;
  active: boolean;
}

/** Trạng thái đạt KPI dùng cho badge */
export type KpiStatus = "dat" | "gan-dat" | "yeu" | "chua-nhap";

export interface RankRow {
  rank: number;
  employeeId: string;
  name: string;
  dept: DeptCode;
  revenue: number;
  target: number;
  /** revenue / target */
  progress: number;
  status: KpiStatus;
}

/** Điểm dữ liệu cho biểu đồ Recharts (doanh thu theo ngày) */
export interface RevenuePoint {
  /** nhãn trục X, vd "01/07" */
  label: string;
  doanhThu: number;
  mucTieu: number;
}
