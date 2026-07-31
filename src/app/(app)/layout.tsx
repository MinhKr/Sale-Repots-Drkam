import { AppShell } from "@/components/shell/app-shell";
import type { SessionUser } from "@/components/shell/user-menu";
import { getCurrentUser } from "@/lib/auth";
import { DEPT_LABEL, REGION_LABEL } from "@/lib/mock/employees";

/** Tên/email hiện ở góc trên bên phải — theo đúng tài khoản đang đăng nhập. */
function toSessionUser(me: Awaited<ReturnType<typeof getCurrentUser>>): SessionUser {
  const e = me.employee;

  // Tài khoản chung của phòng chưa gắn với nhân viên nào.
  if (!e) {
    return {
      name: "Phòng Sale DrKam",
      email: me.email || "sale@drkam.vn",
      initials: "PS",
    };
  }

  // Nhãn phụ: bộ phận, thêm miền nếu là Livestream (dễ phân biệt MB/MN).
  const parts = [e.role === "LEAD" ? "Lead / BGĐ" : DEPT_LABEL[e.dept]];
  if (e.region) parts.push(REGION_LABEL[e.region]);

  return {
    name: e.name,
    email: me.email,
    initials: e.initials,
    subtitle: parts.join(" · "),
  };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Menu "Quản lý nhân viên" / "Cấu hình KPI" chỉ hiện với người có toàn
  // quyền. Đây chỉ là lớp giao diện — trang và action đều tự kiểm tra lại.
  const me = await getCurrentUser();
  const isManager =
    me.isManager ||
    me.employee?.role === "LEAD" ||
    me.employee?.dept === "ADMIN";

  return (
    <AppShell isManager={isManager} user={toSessionUser(me)}>
      {children}
    </AppShell>
  );
}
