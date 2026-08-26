"use server";

import { eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireManager } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primaryDept, sortDepts } from "./depts";
import { DEPTS, MIN_PASSWORD_LENGTH } from "./constants";
import { emailFromName } from "./email";

/**
 * Cấp / thu hồi tài khoản đăng nhập cho nhân viên (P12).
 *
 * 🔴 Mọi action ở đây dùng SERVICE ROLE (bỏ qua RLS) nên `requireManager()`
 * là cổng chặn duy nhất — không được bỏ dòng đó ở bất kỳ hàm nào.
 */

function revalidateAll() {
  revalidatePath("/nhan-vien");
  revalidatePath("/home");
  revalidatePath("/kpi");
}

/** Các trang phụ thuộc vào "ai thuộc bộ phận nào" — đổi dept là phải nạp lại. */
function revalidateReports() {
  revalidatePath("/reports/sale");
  revalidatePath("/reports/cskh");
  revalidatePath("/reports/livestream");
  revalidatePath("/reports/sao-xau");
  revalidatePath("/dashboard-ca-nhan");
}

/** Chữ cái viết tắt cho avatar: 2 ký tự đầu của tên gọi. */
function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/);
  const given = words[words.length - 1] ?? name;
  return given.slice(0, 2);
}

/** Email đã dùng (ở bảng employees) để tránh trùng khi sinh mới. */
async function takenEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: schema.employees.email })
    .from(schema.employees)
    .where(isNotNull(schema.employees.email));
  return rows.map((r) => r.email as string);
}

/* ------------------------------------------------------------------ */
/*  Cấp tài khoản cho nhân viên đã có trong danh sách                   */
/* ------------------------------------------------------------------ */

const idSchema = z.object({ employeeId: z.string().uuid() });

/** Tài khoản + mật khẩu do người quản lý tự nhập. */
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`)
    .max(72, "Mật khẩu quá dài"),
});

const createAccountSchema = idSchema.extend(credentialsSchema.shape);

export interface CreateAccountResult {
  email: string;
  password: string;
}

/**
 * Tạo tài khoản đăng nhập cho 1 nhân viên, dùng đúng email + mật khẩu người
 * quản lý nhập (PM chốt 2026-07-31: KHÔNG tự đặt mật khẩu mặc định nữa).
 * `email_confirm: true` để không cần hộp thư thật xác nhận.
 */
export async function createAccount(input: unknown): Promise<CreateAccountResult> {
  await requireManager();
  const { employeeId, email, password } = createAccountSchema.parse(input);

  const [emp] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);

  if (!emp) throw new Error("Không tìm thấy nhân viên.");
  if (emp.authUserId) throw new Error(`${emp.shortName} đã có tài khoản rồi.`);
  // Đọc thẳng cột DB (enum còn value "MKT" đã ngưng dùng) — needsAccount chỉ
  // cần chuỗi nên khỏi phải ép kiểu về DeptCode.
  const empDepts = emp.depts?.length ? emp.depts : [emp.dept];
  if (!needsAccount(empDepts, emp.employment)) {
    throw new Error(
      `${emp.shortName} là Livestream part-time nên không cần tài khoản — báo cáo do bạn fulltime cùng miền nhập hộ.`,
    );
  }

  // Email phải chưa ai dùng — báo sớm thay vì để Supabase trả lỗi khó hiểu.
  const used = await takenEmails();
  if (used.some((e) => e.toLowerCase() === email && e !== emp.email)) {
    throw new Error(`Email ${email} đã được dùng cho nhân viên khác.`);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { employee_code: emp.code, full_name: emp.name },
  });

  if (error || !data.user) {
    throw new Error(`Không tạo được tài khoản: ${error?.message ?? "lỗi không rõ"}`);
  }

  // Nối tài khoản vào hồ sơ nhân viên. Nếu bước này hỏng thì user Auth đã tạo
  // sẽ mồ côi → xóa đi để lần bấm sau làm lại được từ đầu.
  try {
    await db
      .update(schema.employees)
      .set({ email, authUserId: data.user.id })
      .where(eq(schema.employees.id, employeeId));
  } catch (e) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw e;
  }

  revalidateAll();
  return { email, password };
}

/* ------------------------------------------------------------------ */
/*  Thêm nhân viên mới (luôn kèm tài khoản đăng nhập)                   */
/* ------------------------------------------------------------------ */

const newEmployeeSchema = z
  .object({
    name: z.string().trim().min(2, "Họ tên quá ngắn").max(100),
    shortName: z.string().trim().min(1, "Chưa có tên hiển thị").max(50),
    /** Bộ phận kiêm nhiệm — ít nhất 1 */
    depts: z.array(z.enum(DEPTS)).min(1, "Phải chọn ít nhất 1 bộ phận."),
    /** Chỉ Livestream mới cần — quyết định quyền nhập báo cáo */
    region: z.enum(["MB", "MN"]).nullish(),
    employment: z.enum(["FT", "PT"]).nullish(),
    /** Bỏ trống với người không được cấp tài khoản (xem needsAccount) */
    email: z.string().trim().toLowerCase().optional(),
    password: z.string().optional(),
  })
  .refine(
    (v) => !v.depts.includes("LIVESTREAM") || (!!v.region && !!v.employment),
    { message: "Nhân viên Livestream phải chọn miền và loại hợp đồng." },
  );

/**
 * Livestream part-time KHÔNG nhập báo cáo (fulltime cùng miền nhập hộ) nên
 * không cấp tài khoản đăng nhập. Mọi trường hợp còn lại đều cấp — kể cả người
 * kiêm Livestream PT + một tổ khác, vì tổ kia vẫn cần họ tự nhập.
 */
function needsAccount(depts: string[], employment?: string | null): boolean {
  const onlyLive = depts.length === 1 && depts[0] === "LIVESTREAM";
  return !(onlyLive && employment === "PT");
}

/** Thêm nhân viên mới — cấp kèm tài khoản, trừ Livestream part-time. */
export async function createEmployee(
  input: unknown,
): Promise<{ employeeId: string; account: CreateAccountResult | null }> {
  await requireManager();
  const values = newEmployeeSchema.parse(input);
  const depts = sortDepts(values.depts);
  const withAccount = needsAccount(depts, values.employment);

  // `code` (slug) là khóa ổn định để map dữ liệu. Người không được cấp tài
  // khoản vẫn cần code nên sinh từ họ tên theo đúng quy tắc email.
  const suggested = emailFromName(values.name, await takenEmails());
  const email = withAccount ? values.email : undefined;
  if (withAccount) credentialsSchema.parse({ email, password: values.password });
  const code = (email ?? suggested).split("@")[0];
  if (!code) throw new Error("Không xác định được mã nhân viên từ họ tên.");

  const [inserted] = await db
    .insert(schema.employees)
    .values({
      code,
      name: values.name,
      shortName: values.shortName,
      dept: primaryDept(depts, depts[0]),
      depts,
      role: depts.includes("LEAD") ? "LEAD" : "STAFF",
      initials: initialsFromName(values.name),
      region: values.region ?? null,
      employment: values.employment ?? null,
      active: true,
      // Người chưa được cấp tài khoản để trống email → bảng hiện "Chưa cấp".
      email: email ?? null,
    })
    .returning({ id: schema.employees.id });

  if (!withAccount) {
    revalidateAll();
    revalidateReports();
    return { employeeId: inserted.id, account: null };
  }

  // Cấp tài khoản hỏng (email trùng, Supabase từ chối...) thì gỡ luôn dòng
  // nhân viên vừa chèn — tránh để lại hồ sơ mồ côi không đăng nhập được.
  let account: CreateAccountResult;
  try {
    account = await createAccount({
      employeeId: inserted.id,
      email,
      password: values.password,
    });
  } catch (e) {
    await db.delete(schema.employees).where(eq(schema.employees.id, inserted.id));
    throw e;
  }

  revalidateAll();
  revalidateReports();
  return { employeeId: inserted.id, account };
}

/* ------------------------------------------------------------------ */
/*  Đổi bộ phận                                                         */
/* ------------------------------------------------------------------ */

const setDeptsSchema = idSchema.extend({
  depts: z.array(z.enum(DEPTS)).min(1, "Phải chọn ít nhất 1 bộ phận."),
});

/**
 * Đặt danh sách bộ phận của nhân viên — một người kiêm được nhiều tổ.
 *
 * Bộ phận quyết định nhân viên xuất hiện ở tab báo cáo nào và ai được nhập hộ
 * (xem lib/permissions.ts), nên chỉ quản lý mới đổi được.
 *
 * Ba hệ quả đi kèm, làm luôn ở đây để dữ liệu không tự mâu thuẫn:
 *  - `dept` (bộ phận chính) được tính lại theo DEPT_ORDER. Đây là tổ mà KPI và
 *    thanh tiến độ trên Trang chủ xếp họ vào — cố ý chỉ một, để một người
 *    kiêm 2 tổ không bị cộng doanh thu hai lần.
 *  - Bỏ tick Livestream → xóa Miền + FT/PT (hai cột chỉ có nghĩa với Livestream).
 *  - Tick/bỏ tick LEAD → đổi `role` theo, vì quyền toàn phần đọc `role`.
 *
 * Người mới tick Livestream sẽ chưa có Miền/FT-PT: bảng hiện sẵn hai ô chọn để
 * quản lý điền, và chừng nào chưa điền thì họ chưa nhập được báo cáo Livestream.
 */
export async function setDepts(input: unknown): Promise<void> {
  await requireManager();
  const { employeeId, depts: raw } = setDeptsSchema.parse(input);
  const depts = sortDepts(raw);

  const [emp] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  if (!emp) throw new Error("Không tìm thấy nhân viên.");

  const leavingLive = !depts.includes("LIVESTREAM");

  await db
    .update(schema.employees)
    .set({
      depts,
      // Giữ nguyên tổ gốc nếu vẫn còn tick — tick thêm tổ không làm nhảy KPI.
      dept: primaryDept(depts, emp.dept as (typeof depts)[number]),
      role: depts.includes("LEAD") ? "LEAD" : "STAFF",
      ...(leavingLive ? { region: null, employment: null } : {}),
    })
    .where(eq(schema.employees.id, employeeId));

  revalidateAll();
  revalidateReports();
}

/* ------------------------------------------------------------------ */
/*  Cập nhật miền + loại hợp đồng (chỉ Livestream dùng)                 */
/* ------------------------------------------------------------------ */

const workInfoSchema = idSchema.extend({
  region: z.enum(["MB", "MN"]).nullable(),
  employment: z.enum(["FT", "PT"]).nullable(),
});

/**
 * Đặt Miền (MB/MN) + Fulltime/Parttime cho nhân viên Livestream.
 * Hai giá trị này quyết định quyền nhập báo cáo Livestream: chỉ FT được nhập,
 * và nhập hộ được các PT cùng miền — nên chỉ quản lý mới đổi được.
 */
export async function setWorkInfo(input: unknown): Promise<void> {
  await requireManager();
  const { employeeId, region, employment } = workInfoSchema.parse(input);

  await db
    .update(schema.employees)
    .set({ region, employment })
    .where(eq(schema.employees.id, employeeId));

  revalidateAll();
  revalidatePath("/reports/livestream");
}

/* ------------------------------------------------------------------ */
/*  Đặt lại mật khẩu                                                    */
/* ------------------------------------------------------------------ */

/** Đặt lại mật khẩu cho 1 nhân viên — mật khẩu do quản lý tự nhập. */
export async function resetPassword(input: unknown): Promise<{ password: string }> {
  await requireManager();
  const { employeeId, password } = idSchema
    .extend({ password: credentialsSchema.shape.password })
    .parse(input);

  const [emp] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);

  if (!emp?.authUserId) throw new Error("Nhân viên này chưa có tài khoản.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(emp.authUserId, {
    password,
  });
  if (error) throw new Error(`Không đặt lại được mật khẩu: ${error.message}`);

  return { password };
}

/* ------------------------------------------------------------------ */
/*  Khóa / mở tài khoản                                                 */
/* ------------------------------------------------------------------ */

const setActiveSchema = idSchema.extend({ active: z.boolean() });

/**
 * Khóa (nghỉ việc) hoặc mở lại nhân viên.
 * Khóa = cấm đăng nhập 100 năm bên Auth + active=false ở DB (giữ nguyên dữ
 * liệu báo cáo cũ để số liệu các tháng trước không đổi).
 */
export async function setEmployeeActive(input: unknown): Promise<void> {
  await requireManager();
  const { employeeId, active } = setActiveSchema.parse(input);

  const [emp] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  if (!emp) throw new Error("Không tìm thấy nhân viên.");

  if (emp.authUserId) {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(emp.authUserId, {
      ban_duration: active ? "none" : "876000h", // ~100 năm
    });
    if (error) throw new Error(`Không đổi được trạng thái tài khoản: ${error.message}`);
  }

  await db
    .update(schema.employees)
    .set({ active })
    .where(eq(schema.employees.id, employeeId));

  revalidateAll();
  revalidateReports();
}

/* ------------------------------------------------------------------ */
/*  Thu hồi tài khoản                                                   */
/* ------------------------------------------------------------------ */

/**
 * Xóa tài khoản đăng nhập nhưng GIỮ hồ sơ nhân viên + toàn bộ báo cáo cũ.
 * Dùng khi cấp nhầm hoặc muốn cấp lại email khác.
 */
export async function deleteAccount(input: unknown): Promise<void> {
  await requireManager();
  const { employeeId } = idSchema.parse(input);

  const [emp] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);

  if (!emp?.authUserId) throw new Error("Nhân viên này chưa có tài khoản.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(emp.authUserId);
  if (error) throw new Error(`Không xóa được tài khoản: ${error.message}`);

  await db
    .update(schema.employees)
    .set({ authUserId: null })
    .where(eq(schema.employees.id, employeeId));

  revalidateAll();
}
