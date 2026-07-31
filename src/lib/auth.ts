import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createClient } from "@/lib/supabase/server";
import type { DeptCode, Employment, Region, Role } from "@/lib/mock/types";

/**
 * Bắt buộc phải có phiên đăng nhập hợp lệ.
 *
 * ⚠️ Kết nối Drizzle dùng user `postgres` (chủ bảng) nên **BỎ QUA RLS**.
 * Vì vậy MỌI Server Action / truy vấn dữ liệu phải gọi hàm này trước —
 * đây là lớp kiểm soát truy cập duy nhất ở tầng ứng dụng (xem nợ kỹ thuật P8).
 *
 * Dùng getUser() (xác thực với server Supabase), KHÔNG dùng getSession()
 * — getSession() chỉ đọc cookie nên có thể bị giả mạo.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Chưa đăng nhập — thao tác bị từ chối.");
  }
  return user;
}

/**
 * Email của (các) tài khoản quản lý — tài khoản chung của phòng Sale.
 * Đặt ở env để đổi được mà không phải sửa code; mặc định là tài khoản đang dùng.
 */
const MANAGER_EMAILS = (process.env.MANAGER_EMAILS ?? "sale@drkam.vn")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Danh tính người đang đăng nhập, kèm việc họ có phải quản lý không. */
export interface CurrentUser {
  authUserId: string;
  email: string;
  /** Quản lý = tài khoản chung của phòng, hoặc nhân viên có vai trò LEAD. */
  isManager: boolean;
  /** Nhân viên tương ứng — null nếu là tài khoản chung (không gắn với ai). */
  employee: ActorEmployee | null;
}

/** Hồ sơ nhân viên rút gọn — đủ để quyết định quyền (xem lib/permissions.ts). */
export interface ActorEmployee {
  id: string;
  code: string | null;
  name: string;
  shortName: string;
  initials: string;
  dept: DeptCode;
  role: Role;
  /** Chỉ Livestream mới có — quyết định quyền nhập báo cáo Livestream */
  region: Region | null;
  employment: Employment | null;
}

/**
 * Người đang đăng nhập + hồ sơ nhân viên tương ứng (nếu có).
 *
 * Ghép qua `employees.auth_user_id`. Tài khoản chung `sale@drkam.vn` không gắn
 * với nhân viên nào nên `employee` = null nhưng `isManager` = true.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await requireUser();
  const email = (user.email ?? "").toLowerCase();

  const [row] = await db
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
    })
    .from(schema.employees)
    .where(eq(schema.employees.authUserId, user.id))
    .limit(1);

  // Nhân viên đã bị khóa thì coi như không có hồ sơ — chặn mọi thao tác dữ liệu.
  const employee = row && row.active ? row : null;

  return {
    authUserId: user.id,
    email,
    isManager: MANAGER_EMAILS.includes(email) || employee?.role === "LEAD",
    employee: employee
      ? {
          id: employee.id,
          code: employee.code,
          name: employee.name,
          shortName: employee.shortName,
          initials: employee.initials,
          dept: employee.dept as DeptCode,
          role: employee.role as Role,
          region: employee.region as Region | null,
          employment: employee.employment as Employment | null,
        }
      : null,
  };
}

/**
 * Bắt buộc có toàn quyền: tài khoản chung, Lead, hoặc Admin (Hương).
 * Dùng cho các màn quản trị số liệu chung như Cấu hình KPI — nhân viên thường
 * không được sửa mục tiêu doanh thu của cả team.
 */
export async function requireFullAccess(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  const e = current.employee;
  const ok = current.isManager || e?.role === "LEAD" || e?.dept === "ADMIN";
  if (!ok) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }
  return current;
}

/**
 * Bắt buộc là tài khoản quản lý.
 *
 * ⚠️ Đây là cổng chặn DUY NHẤT cho các thao tác cấp/thu tài khoản (chúng dùng
 * service role, bỏ qua RLS). Mọi action trong lib/employees/actions.ts PHẢI
 * gọi hàm này trước tiên.
 */
export async function requireManager(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current.isManager) {
    throw new Error("Chỉ tài khoản quản lý mới được thực hiện thao tác này.");
  }
  return current;
}
