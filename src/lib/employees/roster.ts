import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { deptsOf } from "@/lib/employees/depts";
import type { DeptCode, Employment, Region } from "@/lib/mock/types";

/**
 * Danh bạ nhân viên như CLIENT nhìn thấy — thay cho hằng EMPLOYEES trong mock.
 *
 * Bộ phận giờ sửa được ở màn Quản lý nhân viên, nên mọi màn hỏi "ai thuộc bộ
 * phận nào" (tab báo cáo, cấu hình KPI) phải đọc từ DB; dùng danh sách cứng cũ
 * thì đổi bộ phận xong giao diện vẫn xếp người vào chỗ cũ.
 *
 * `id` ở đây là `employees.code` (slug) chứ không phải uuid — mọi dòng báo cáo
 * phía client đều tham chiếu bằng slug (xem toReportRow ở lib/reports/shared.ts).
 */
export interface RosterEmployee {
  /** slug (employees.code) */
  id: string;
  name: string;
  shortName: string;
  initials: string;
  /** Bộ phận chính — dùng để gom nhóm (KPI, tiến độ theo tổ) */
  dept: DeptCode;
  /** Toàn bộ bộ phận kiêm nhiệm — dùng để lọc ô chọn ở từng tab báo cáo */
  depts: DeptCode[];
  region: Region | null;
  employment: Employment | null;
  active: boolean;
}

/** Bản ghi tối thiểu để dựng được RosterEmployee (người chưa có slug bị bỏ). */
export interface RosterSource {
  code: string | null;
  name: string;
  shortName: string;
  initials: string;
  dept: DeptCode;
  depts: DeptCode[] | null;
  region: Region | null;
  employment: Employment | null;
  active: boolean;
}

export function toRoster(rows: RosterSource[]): RosterEmployee[] {
  return rows
    .filter((e): e is RosterSource & { code: string } => !!e.code)
    .map((e) => ({
      id: e.code,
      name: e.name,
      shortName: e.shortName,
      initials: e.initials,
      dept: e.dept,
      depts: deptsOf(e),
      region: e.region,
      employment: e.employment,
      active: e.active,
    }));
}

/** Đọc danh bạ trực tiếp từ DB (dùng khi trang chưa nạp sẵn bảng nhân viên). */
export async function listRoster(): Promise<RosterEmployee[]> {
  const rows = await db
    .select({
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
    .from(schema.employees)
    .orderBy(asc(schema.employees.dept), asc(schema.employees.name));

  return toRoster(rows as RosterSource[]);
}
