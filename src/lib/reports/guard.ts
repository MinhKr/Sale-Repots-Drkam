import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import {
  editableEmployees,
  visibleEmployees,
  visibleTabs,
  whyReadOnly,
  type Actor,
  type EmployeeLike,
} from "@/lib/permissions";
import { deptsOf } from "@/lib/employees/depts";
import { toRoster, type RosterEmployee } from "@/lib/employees/roster";
import type { ConfigTab } from "@/lib/mock/reports";
import type { DeptCode, Employment, Region } from "@/lib/mock/types";

/**
 * Cổng chặn quyền NHẬP báo cáo ở phía SERVER.
 *
 * ⚠️ Drizzle kết nối bằng user `postgres` nên bỏ qua RLS — đây là lớp chặn
 * thật sự duy nhất. Giao diện có ẩn nút hay không cũng không tính; ai gửi
 * thẳng request lên Server Action vẫn phải đi qua đây.
 */

interface PermEmployee extends EmployeeLike {
  id: string;
  code: string | null;
  name: string;
  shortName: string;
  initials: string;
  dept: DeptCode;
  depts: DeptCode[];
  region: Region | null;
  employment: Employment | null;
  active: boolean;
}

async function loadPermEmployees(): Promise<PermEmployee[]> {
  const rows = await db
    .select({
      id: schema.employees.id,
      code: schema.employees.code,
      name: schema.employees.name,
      shortName: schema.employees.shortName,
      initials: schema.employees.initials,
      dept: schema.employees.dept,
      depts: schema.employees.depts,
      region: schema.employees.region,
      employment: schema.employees.employment,
      active: schema.employees.active,
    })
    .from(schema.employees);

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    shortName: r.shortName,
    initials: r.initials,
    dept: r.dept as DeptCode,
    depts: deptsOf({
      dept: r.dept as DeptCode,
      depts: r.depts as DeptCode[] | null,
    }),
    region: r.region as Region | null,
    employment: r.employment as Employment | null,
    active: r.active,
  }));
}


export interface EditScope {
  actor: Actor;
  /** uuid các nhân viên mà người đang đăng nhập được nhập/sửa hộ ở tab này */
  editableIds: Set<string>;
}

/** Tính phạm vi được sửa của người đang đăng nhập ở 1 tab. */
export async function loadEditScope(tab: ConfigTab): Promise<EditScope> {
  const current = await getCurrentUser();
  const actor: Actor = {
    isManager: current.isManager,
    employee: current.employee,
  };
  const employees = await loadPermEmployees();
  const allowed = editableEmployees(actor, tab, employees);
  return { actor, editableIds: new Set(allowed.map((e) => e.id)) };
}

export type { RosterEmployee };

export interface TabPermission {
  /** `code` (slug) các nhân viên được nhập hộ — dùng ở client để lọc UI */
  editableCodes: string[];
  /** Lý do chỉ-được-xem, null nếu có quyền nhập */
  readOnlyReason: string | null;
  /** Có thấy dữ liệu của người khác không (Lead/Admin) — để đổi câu mô tả */
  seesEveryone: boolean;
}

export interface TabAccess {
  /** Được vào tab này không. false → trang trả 404. */
  canView: boolean;
  /** uuid các nhân viên được XEM — dùng để lọc truy vấn ở server */
  visibleIds: string[];
  perm: TabPermission;
  /** Danh bạ nhân viên (theo DB) để client hiện tên + lọc ô chọn theo bộ phận */
  roster: RosterEmployee[];
}

/**
 * Quyền của người đang đăng nhập ở 1 tab. Dùng cho Server Component của các
 * trang báo cáo: quyết định có cho vào không, lọc dữ liệu, và truyền phần
 * gọn xuống client để ẩn nút.
 */
export async function loadTabAccess(tab: ConfigTab): Promise<TabAccess> {
  const current = await getCurrentUser();
  const actor: Actor = {
    isManager: current.isManager,
    employee: current.employee,
  };
  const employees = await loadPermEmployees();

  const canView = visibleTabs(actor).includes(tab);
  const visible = visibleEmployees(actor, tab, employees);
  const editable = editableEmployees(actor, tab, employees);
  const seesEveryone = visible.length === employees.length;

  return {
    canView,
    visibleIds: visible.map((e) => e.id),
    roster: toRoster(employees),
    perm: {
      editableCodes: editable
        .map((e) => e.code)
        .filter((c): c is string => !!c),
      readOnlyReason: editable.length ? null : whyReadOnly(actor, tab),
      seesEveryone,
    },
  };
}

/**
 * Chặn nếu không được phép ghi báo cáo cho nhân viên này.
 * Thông báo cố ý ngắn gọn, không tiết lộ ai được phép.
 */
export async function assertCanEditFor(
  tab: ConfigTab,
  employeeUuid: string,
): Promise<EditScope> {
  const scope = await loadEditScope(tab);
  if (!scope.editableIds.has(employeeUuid)) {
    throw new Error("Bạn không có quyền nhập/sửa báo cáo cho nhân viên này.");
  }
  return scope;
}
