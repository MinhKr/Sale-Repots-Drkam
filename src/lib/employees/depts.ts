import { DEPT_LABEL } from "@/lib/mock/employees";
import type { DeptCode } from "@/lib/mock/types";

/**
 * Một nhân viên có thể kiêm NHIỀU bộ phận (chốt 2026-08-26).
 *
 * `employees.depts` là nguồn sự thật: nó quyết định người đó hiện ở tab báo
 * cáo nào và ai được nhập hộ. `employees.dept` chỉ là **bộ phận chính** rút ra
 * từ mảng đó, dùng cho chỗ nào bắt buộc mỗi người đúng một nhóm — cấu hình
 * KPI và thanh tiến độ theo tổ ở Trang chủ — để không đếm trùng một người.
 */

/** Thứ tự ưu tiên khi chọn bộ phận chính: làm nghiệp vụ trước, chức vụ sau. */
export const DEPT_ORDER: DeptCode[] = [
  "SALE",
  "CSKH",
  "LIVESTREAM",
  "ADMIN",
  "LEAD",
];

/** Sắp xếp danh sách bộ phận theo DEPT_ORDER (bỏ trùng). */
export function sortDepts(depts: DeptCode[]): DeptCode[] {
  const set = new Set(depts);
  return DEPT_ORDER.filter((d) => set.has(d));
}

/**
 * Bộ phận CHÍNH = tổ mang KPI của người đó.
 *
 * Quy tắc: GIỮ NGUYÊN tổ hiện tại nếu tổ đó vẫn còn được tick. Tick thêm tổ
 * mới không được làm nhảy tổ gốc — Chinh là CSKH, tick thêm Sale để nhập hộ
 * số liệu Sale thì KPI của cô ấy vẫn phải nằm ở CSKH, không có KPI Sale
 * (khách chốt 2026-08-26). Chỉ khi tổ gốc bị bỏ tick mới lấy tổ đầu theo
 * DEPT_ORDER.
 */
export function primaryDept(depts: DeptCode[], current: DeptCode): DeptCode {
  if (depts.includes(current)) return current;
  return sortDepts(depts)[0] ?? current;
}

/**
 * Bộ phận của 1 người, đọc an toàn.
 * Dòng cũ chưa kịp backfill (`depts` rỗng) thì rơi về `dept` — nhờ vậy phân
 * quyền không bị hở trong lúc migration chưa chạy xong.
 */
export function deptsOf(e: {
  dept: DeptCode;
  depts?: DeptCode[] | null;
}): DeptCode[] {
  return e.depts?.length ? e.depts : [e.dept];
}

/** Người này có tham gia bộ phận nào trong `wanted` không. */
export function inAnyDept(
  e: { dept: DeptCode; depts?: DeptCode[] | null },
  wanted: DeptCode[],
): boolean {
  const mine = deptsOf(e);
  return wanted.some((d) => mine.includes(d));
}

/** Nhãn gộp để hiển thị, vd "Sale · CSKH". */
export function deptsLabel(depts: DeptCode[]): string {
  return sortDepts(depts).map((d) => DEPT_LABEL[d]).join(" · ");
}
