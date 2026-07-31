import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireManager } from "@/lib/auth";
import type { DeptCode, Employment, Region, Role } from "@/lib/mock/types";

export interface EmployeeAccountRow {
  id: string;
  code: string | null;
  name: string;
  shortName: string;
  initials: string;
  dept: DeptCode;
  role: Role;
  active: boolean;
  /** Miền + loại hợp đồng — chỉ Livestream dùng, quyết định quyền nhập */
  region: Region | null;
  employment: Employment | null;
  /** Email đăng nhập — null nếu chưa cấp tài khoản */
  email: string | null;
  /** Đã có tài khoản đăng nhập bên Supabase Auth chưa */
  hasAccount: boolean;
}

/**
 * Danh sách nhân viên kèm trạng thái tài khoản — cho màn Quản lý nhân viên.
 * Chỉ quản lý mới gọi được (danh sách email đăng nhập là thông tin nhạy cảm).
 */
export async function listEmployeeAccounts(): Promise<EmployeeAccountRow[]> {
  await requireManager();

  const rows = await db
    .select({
      id: schema.employees.id,
      code: schema.employees.code,
      name: schema.employees.name,
      shortName: schema.employees.shortName,
      initials: schema.employees.initials,
      dept: schema.employees.dept,
      role: schema.employees.role,
      region: schema.employees.region,
      employment: schema.employees.employment,
      active: schema.employees.active,
      email: schema.employees.email,
      authUserId: schema.employees.authUserId,
    })
    .from(schema.employees)
    .orderBy(asc(schema.employees.dept), asc(schema.employees.name));

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    shortName: r.shortName,
    initials: r.initials,
    dept: r.dept as DeptCode,
    role: r.role as Role,
    region: r.region as Region | null,
    employment: r.employment as Employment | null,
    active: r.active,
    email: r.email,
    hasAccount: !!r.authUserId,
  }));
}
