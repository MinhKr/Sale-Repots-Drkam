/**
 * Kiểu dữ liệu domain dùng chung cho toàn app (giai đoạn mock).
 * Khi sang Giai đoạn 2 (DB thật) sẽ ánh xạ 1-1 sang schema Drizzle.
 */

/**
 * Bộ phận biên chế nhân sự (ADMIN = quản trị, nhập được mọi tab như Lead).
 * Bộ phận MKT đã gỡ khỏi app 2026-07-31 (enum "MKT" vẫn còn trong DB, xem db/schema/enums.ts).
 */
export type DeptCode = "SALE" | "CSKH" | "LIVESTREAM" | "ADMIN" | "LEAD";

/** 4 loại tab báo cáo (Sao Xấu là loại báo cáo, không phải bộ phận) */
export type ReportTab = "SALE" | "CSKH" | "SAO_XAU" | "LIVESTREAM";

export type Role = "STAFF" | "LEAD";

/** Miền làm việc (chỉ Livestream) */
export type Region = "MB" | "MN";
/** Loại hợp đồng (chỉ Livestream) */
export type Employment = "FT" | "PT";

export interface Employee {
  id: string;
  /** Họ tên đầy đủ — dùng cho hồ sơ, xuất báo cáo */
  name: string;
  /** Tên gọi ngắn, phân biệt được — dùng cho bảng/dashboard (vd "Phượng Sale") */
  shortName: string;
  dept: DeptCode;
  role: Role;
  /** Chữ cái viết tắt cho Avatar fallback */
  initials: string;
  active: boolean;
  /** Miền (chỉ Livestream) — hiển thị nhãn, không lưu DB */
  region?: Region;
  /** Fulltime/Parttime (chỉ Livestream) — hiển thị nhãn, không lưu DB */
  employment?: Employment;
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
