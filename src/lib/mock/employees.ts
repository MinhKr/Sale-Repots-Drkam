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
 * Nhân sự THẬT của phòng Sale DrKam (dùng cho toàn bộ mock data).
 * Nguồn: docs/ROADMAP.md — 11 NV + 1 Lead.
 */
export const EMPLOYEES: Employee[] = [
  // Sale (1)
  { id: "sale-phuong", name: "Phượng", dept: "SALE", role: "STAFF", initials: "Ph", active: true },

  // CSKH (3) — có thể nhập cả tab Sao Xấu
  { id: "cskh-phuong", name: "Phương", dept: "CSKH", role: "STAFF", initials: "Ph", active: true },
  { id: "cskh-chinh", name: "Chinh", dept: "CSKH", role: "STAFF", initials: "Ch", active: true },
  { id: "cskh-huong", name: "Hương", dept: "CSKH", role: "STAFF", initials: "Hg", active: true },

  // Livestream (6) — Lead nhập hộ
  { id: "live-thu", name: "Thư", dept: "LIVESTREAM", role: "STAFF", initials: "Th", active: true },
  { id: "live-thuy-mn", name: "Thúy MN", dept: "LIVESTREAM", role: "STAFF", initials: "Th", active: true },
  { id: "live-trang-mn", name: "Trang MN", dept: "LIVESTREAM", role: "STAFF", initials: "Tr", active: true },
  { id: "live-vy-mn", name: "Vy MN", dept: "LIVESTREAM", role: "STAFF", initials: "Vy", active: true },
  { id: "live-thuy", name: "Thủy", dept: "LIVESTREAM", role: "STAFF", initials: "Th", active: true },
  { id: "live-binh", name: "Bình", dept: "LIVESTREAM", role: "STAFF", initials: "Bi", active: true },

  // MKT (1) — Lead nhập hộ
  { id: "mkt-ha", name: "Nguyễn Thị Hà", dept: "MKT", role: "STAFF", initials: "Hà", active: true },

  // Lead / BGĐ (1)
  { id: "lead-ly", name: "Lê Hoài Ly", dept: "LEAD", role: "LEAD", initials: "Ly", active: true },
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
