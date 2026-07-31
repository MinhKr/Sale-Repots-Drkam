import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import {
  editableEmployees,
  whyReadOnly,
  type Actor,
  type EmployeeLike,
} from "@/lib/permissions";
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
  dept: DeptCode;
  region: Region | null;
  employment: Employment | null;
  active: boolean;
}

async function loadPermEmployees(): Promise<PermEmployee[]> {
  const rows = await db
    .select({
      id: schema.employees.id,
      code: schema.employees.code,
      dept: schema.employees.dept,
      region: schema.employees.region,
      employment: schema.employees.employment,
      active: schema.employees.active,
    })
    .from(schema.employees);

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    dept: r.dept as DeptCode,
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

export interface TabPermission {
  /** `code` (slug) các nhân viên được nhập hộ — dùng ở client để lọc UI */
  editableCodes: string[];
  /** Lý do chỉ-được-xem, null nếu có quyền nhập */
  readOnlyReason: string | null;
}

/**
 * Quyền của người đang đăng nhập ở 1 tab, dạng gọn để truyền xuống client.
 * Dùng cho Server Component của các trang báo cáo.
 */
export async function loadTabPermission(
  tab: ConfigTab,
): Promise<TabPermission> {
  const current = await getCurrentUser();
  const actor: Actor = {
    isManager: current.isManager,
    employee: current.employee,
  };
  const employees = await loadPermEmployees();
  const allowed = editableEmployees(actor, tab, employees);

  return {
    editableCodes: allowed.map((e) => e.code).filter((c): c is string => !!c),
    readOnlyReason: allowed.length ? null : whyReadOnly(actor, tab),
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
