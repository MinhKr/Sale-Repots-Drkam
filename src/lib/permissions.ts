import { deptsOf, inAnyDept } from "@/lib/employees/depts";
import { CONFIG_BY_TAB, type ConfigTab } from "@/lib/mock/reports";
import type { DeptCode, Employment, Region, Role } from "@/lib/mock/types";

/**
 * Quy tắc phân quyền NHẬP báo cáo (PM chốt 2026-07-31).
 *
 * Nguyên tắc chung (siết lại 2026-07-31c): nhân viên thường **chỉ THẤY dữ
 * liệu của chính mình** — xem gì thì sửa được nấy, không xem được của người
 * khác. Lead / Admin / tài khoản chung vẫn thấy và sửa toàn bộ.
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
 * Từ 2026-08-26 một người kiêm được NHIỀU bộ phận (`employees.depts`): mọi
 * quy tắc dưới đây xét trên TOÀN BỘ danh sách đó, chỉ cần trùng 1 bộ phận là
 * tính. Kiêm Sale + CSKH thì nhập được cả hai tab, cho chính mình.
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
    /** Bộ phận chính (hiển thị) */
    dept: DeptCode;
    /** Toàn bộ bộ phận kiêm nhiệm — nguồn sự thật cho quyền */
    depts?: DeptCode[] | null;
    role: Role;
    region: Region | null;
    employment: Employment | null;
  } | null;
}

/** Nhân viên trong danh sách chọn — chỉ cần các trường ảnh hưởng tới quyền. */
export interface EmployeeLike {
  id: string;
  dept: DeptCode;
  depts?: DeptCode[] | null;
  region?: Region | null;
  employment?: Employment | null;
  active?: boolean;
}

/** Toàn quyền: tài khoản chung, Lead, hoặc Admin (nhập hộ mọi bộ phận). */
export function hasFullAccess(actor: Actor): boolean {
  if (actor.isManager) return true;
  const e = actor.employee;
  return !!e && (e.role === "LEAD" || deptsOf(e).includes("ADMIN"));
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
    (e) => inAnyDept(e, config.allowedDepts) && e.active !== false,
  );

  if (hasFullAccess(actor)) return eligible;

  const me = actor.employee;
  if (!me) return [];

  // Không thuộc bộ phận sở hữu tab → chỉ xem.
  if (!inAnyDept(me, TAB_OWNER_DEPTS[tab])) return [];

  if (tab === "LIVESTREAM") {
    // Parttime không được nhập gì.
    if (me.employment !== "FT") return [];
    // Fulltime: bản thân + các parttime cùng miền.
    return eligible.filter(
      (e) =>
        e.id === me.id ||
        (deptsOf(e).includes("LIVESTREAM") &&
          e.employment === "PT" &&
          e.region === me.region),
    );
  }

  // Các tab còn lại: chỉ dòng của chính mình.
  return eligible.filter((e) => e.id === me.id);
}

/**
 * Danh sách nhân viên mà `actor` được phép XEM báo cáo, ở 1 tab.
 *
 * = phạm vi được sửa, **cộng thêm chính mình**. Phần "cộng thêm" là bắt buộc:
 * Livestream part-time không được sửa gì (fulltime nhập hộ) nhưng vẫn phải
 * xem được số liệu của chính họ, nếu không trang sẽ trống trơn.
 */
export function visibleEmployees<T extends EmployeeLike>(
  actor: Actor,
  tab: ConfigTab,
  employees: T[],
): T[] {
  if (hasFullAccess(actor)) return employees;

  const editable = editableEmployees(actor, tab, employees);
  const me = actor.employee;
  if (!me) return editable;

  const seen = new Set(editable.map((e) => e.id));
  const config = CONFIG_BY_TAB[tab];
  const self = employees.filter(
    (e) => e.id === me.id && !seen.has(e.id) && inAnyDept(e, config.allowedDepts),
  );
  return [...editable, ...self];
}

/** Các tab báo cáo `actor` được vào. Nhân viên thường chỉ có tab bộ phận mình. */
export function visibleTabs(actor: Actor): ConfigTab[] {
  const all: ConfigTab[] = ["SALE", "CSKH", "SAO_XAU", "LIVESTREAM"];
  if (hasFullAccess(actor)) return all;

  const me = actor.employee;
  if (!me) return [];
  return all.filter((t) => inAnyDept(me, TAB_OWNER_DEPTS[t]));
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

  if (
    tab === "LIVESTREAM" &&
    deptsOf(me).includes("LIVESTREAM") &&
    me.employment !== "FT"
  )
    return "Bạn là Livestream part-time nên không nhập báo cáo — bạn fulltime cùng miền nhập hộ.";

  if (tab === "SAO_XAU")
    return "Báo cáo Sao Xấu do Admin và Lead phụ trách.";

  const owner = TAB_OWNER_DEPTS[tab][0];
  const label =
    owner === "SALE" ? "Sale" : owner === "CSKH" ? "CSKH" : "Livestream";
  return `Chỉ nhân viên bộ phận ${label} mới nhập được báo cáo này.`;
}
