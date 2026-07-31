import { CONFIG_BY_TAB, type ConfigTab } from "@/lib/mock/reports";
import type { DeptCode, Employment, Region, Role } from "@/lib/mock/types";

/**
 * Quy tắc phân quyền NHẬP báo cáo (PM chốt 2026-07-31).
 *
 * Nguyên tắc chung: **ai cũng XEM được mọi báo cáo**, nhưng quyền NHẬP/SỬA/XÓA
 * bị giới hạn theo bộ phận:
 *
 *  - Sale  → NV bộ phận Sale, chỉ nhập dòng CỦA CHÍNH MÌNH
 *  - CSKH  → NV bộ phận CSKH, chỉ nhập dòng CỦA CHÍNH MÌNH
 *  - Sao Xấu → chỉ Admin (Hương) + Lead. CSKH KHÔNG còn nhập tab này.
 *  - Livestream → chỉ người **fulltime**; nhập cho mình + các bạn **parttime
 *    CÙNG MIỀN** (Bắc/Nam). Người parttime chỉ xem.
 *
 *  - Admin (Hương) và Lead (Ly) nhập được MỌI tab, cho MỌI người.
 *  - Tài khoản chung của phòng (sale@drkam.vn) cũng có toàn quyền.
 *
 * ⚠️ File này chỉ TÍNH ra quyền. Việc CHẶN thật nằm ở server actions
 * (lib/reports/actions.ts) — giao diện ẩn nút chỉ là cho gọn mắt.
 */

/** Bộ phận "sở hữu" mỗi tab — NV thuộc bộ phận này mới được nhập. */
const TAB_OWNER_DEPTS: Record<ConfigTab, DeptCode[]> = {
  SALE: ["SALE"],
  CSKH: ["CSKH"],
  SAO_XAU: [], // rỗng: chỉ Admin/Lead (xử lý riêng bên dưới)
  LIVESTREAM: ["LIVESTREAM"],
};

/** Người đang thao tác — đủ dữ liệu để quyết định quyền. */
export interface Actor {
  /** Tài khoản chung của phòng, hoặc Lead */
  isManager: boolean;
  employee: {
    id: string;
    dept: DeptCode;
    role: Role;
    region: Region | null;
    employment: Employment | null;
  } | null;
}

/** Nhân viên trong danh sách chọn — chỉ cần các trường ảnh hưởng tới quyền. */
export interface EmployeeLike {
  id: string;
  dept: DeptCode;
  region?: Region | null;
  employment?: Employment | null;
  active?: boolean;
}

/** Toàn quyền: tài khoản chung, Lead, hoặc Admin (nhập hộ mọi bộ phận). */
export function hasFullAccess(actor: Actor): boolean {
  if (actor.isManager) return true;
  const e = actor.employee;
  return !!e && (e.role === "LEAD" || e.dept === "ADMIN");
}

/**
 * Danh sách nhân viên mà `actor` được phép nhập/sửa báo cáo hộ, ở 1 tab.
 * Mảng rỗng = không có quyền nhập gì ở tab đó (chỉ xem).
 */
export function editableEmployees<T extends EmployeeLike>(
  actor: Actor,
  tab: ConfigTab,
  employees: T[],
): T[] {
  const config = CONFIG_BY_TAB[tab];
  // Chỉ xét những NV hợp lệ với tab (và còn làm việc).
  const eligible = employees.filter(
    (e) => config.allowedDepts.includes(e.dept) && e.active !== false,
  );

  if (hasFullAccess(actor)) return eligible;

  const me = actor.employee;
  if (!me) return [];

  // Không thuộc bộ phận sở hữu tab → chỉ xem.
  if (!TAB_OWNER_DEPTS[tab].includes(me.dept)) return [];

  if (tab === "LIVESTREAM") {
    // Parttime không được nhập gì.
    if (me.employment !== "FT") return [];
    // Fulltime: bản thân + các parttime cùng miền.
    return eligible.filter(
      (e) =>
        e.id === me.id ||
        (e.dept === "LIVESTREAM" &&
          e.employment === "PT" &&
          e.region === me.region),
    );
  }

  // Các tab còn lại: chỉ dòng của chính mình.
  return eligible.filter((e) => e.id === me.id);
}

/** Có được nhập gì ở tab này không (dùng để ẩn nút "Nhập báo cáo"). */
export function canEditTab<T extends EmployeeLike>(
  actor: Actor,
  tab: ConfigTab,
  employees: T[],
): boolean {
  return editableEmployees(actor, tab, employees).length > 0;
}

/** Có được nhập/sửa/xóa báo cáo của đúng nhân viên này không. */
export function canEditFor<T extends EmployeeLike>(
  actor: Actor,
  tab: ConfigTab,
  employees: T[],
  targetEmployeeId: string,
): boolean {
  return editableEmployees(actor, tab, employees).some(
    (e) => e.id === targetEmployeeId,
  );
}

/** Câu giải thích hiển thị cho người không có quyền nhập ở tab đang xem. */
export function whyReadOnly(actor: Actor, tab: ConfigTab): string {
  const me = actor.employee;
  if (!me) return "Tài khoản của bạn chỉ được xem báo cáo ở mục này.";

  if (tab === "LIVESTREAM" && me.dept === "LIVESTREAM" && me.employment !== "FT")
    return "Chỉ nhân viên Livestream fulltime mới nhập được báo cáo. Bạn vẫn xem được toàn bộ số liệu.";

  if (tab === "SAO_XAU")
    return "Báo cáo Sao Xấu do Admin và Lead nhập. Bạn vẫn xem được toàn bộ số liệu.";

  const owner = TAB_OWNER_DEPTS[tab][0];
  const label =
    owner === "SALE" ? "Sale" : owner === "CSKH" ? "CSKH" : "Livestream";
  return `Chỉ nhân viên bộ phận ${label} mới nhập được báo cáo này. Bạn vẫn xem được toàn bộ số liệu.`;
}
