import type { DeptCode, Employee } from "./types";

/** Nhãn hiển thị của từng bộ phận */
export const DEPT_LABEL: Record<DeptCode, string> = {
  SALE: "Sale",
  CSKH: "CSKH",
  LIVESTREAM: "Livestream",
  MKT: "Marketing",
  LEAD: "Lead / BGĐ",
};

/**
 * Nhân sự THẬT của phòng Sale DrKam — 12 NV + 1 Lead (13 người).
 * Nguồn: danh sách PM cung cấp 2026-07-16.
 *
 * `name` = họ tên đầy đủ · `shortName` = tên gọi hiển thị ở bảng/dashboard.
 * shortName có hậu tố phân biệt vì dễ nhầm: Phượng (Sale) vs Phương (CSKH),
 * Thủy MB (Nguyễn Thu Thủy) vs Thanh Thúy MN (Nguyễn Thị Thanh Thúy).
 *
 * `id` giữ nguyên slug cũ để dữ liệu báo cáo/KPI/pipeline đã có vẫn map đúng.
 */
export const EMPLOYEES: Employee[] = [
  // Sale (1)
  { id: "sale-phuong", name: "Trần Thị Hoài Phượng", shortName: "Phượng Sale", dept: "SALE", role: "STAFF", initials: "Ph", active: true },

  // CSKH (3) — có thể nhập cả tab Sao Xấu
  { id: "cskh-phuong", name: "Nguyễn Thu Phương", shortName: "Phương CSKH", dept: "CSKH", role: "STAFF", initials: "Pg", active: true },
  { id: "cskh-chinh", name: "Nguyễn Thị Chinh", shortName: "Chinh", dept: "CSKH", role: "STAFF", initials: "Ch", active: true },
  // Hương kiêm admin — theo chốt của PM vẫn thuộc CSKH
  { id: "cskh-huong", name: "Nguyễn Thi Hương", shortName: "Hương", dept: "CSKH", role: "STAFF", initials: "Hg", active: true },

  // Livestream (7) — Lead nhập hộ
  { id: "live-thu", name: "Bàn Minh Thư", shortName: "Thư", dept: "LIVESTREAM", role: "STAFF", initials: "Th", active: true },
  { id: "live-thuy", name: "Nguyễn Thu Thủy", shortName: "Thủy MB", dept: "LIVESTREAM", role: "STAFF", initials: "Tu", active: true },
  { id: "live-binh", name: "Trần Thị Bình", shortName: "Bình", dept: "LIVESTREAM", role: "STAFF", initials: "Bi", active: true },
  { id: "live-dieu-linh", name: "Trần Thị Diệu Linh", shortName: "Diệu Linh", dept: "LIVESTREAM", role: "STAFF", initials: "Li", active: true },
  { id: "live-thuy-mn", name: "Nguyễn Thị Thanh Thúy", shortName: "Thanh Thúy MN", dept: "LIVESTREAM", role: "STAFF", initials: "Ty", active: true },
  { id: "live-vy-mn", name: "Trần Thanh Vy", shortName: "Vy MN", dept: "LIVESTREAM", role: "STAFF", initials: "Vy", active: true },
  { id: "live-trang-mn", name: "Trần Thị Thu Trang", shortName: "Trang MN", dept: "LIVESTREAM", role: "STAFF", initials: "Tr", active: true },

  // MKT (1) — Lead nhập hộ
  { id: "mkt-ha", name: "Nguyễn Thị Hà", shortName: "Hà", dept: "MKT", role: "STAFF", initials: "Hà", active: true },

  // Lead / BGĐ (1)
  { id: "lead-ly", name: "Lê Hoài Ly", shortName: "Ly", dept: "LEAD", role: "LEAD", initials: "Ly", active: true },
];

/** Người dùng đang đăng nhập (mock) — mặc định là Lead để thấy toàn bộ menu */
export const CURRENT_USER: Employee =
  EMPLOYEES.find((e) => e.id === "lead-ly") ?? EMPLOYEES[0];

export function employeesByDept(dept: DeptCode): Employee[] {
  return EMPLOYEES.filter((e) => e.dept === dept);
}

export function getEmployee(id: string): Employee | undefined {
  return EMPLOYEES.find((e) => e.id === id);
}
