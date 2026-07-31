import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Menu "Quản lý nhân viên" chỉ hiện với tài khoản quản lý. Đây chỉ là lớp
  // giao diện — trang /nhan-vien và mọi action đều tự kiểm tra quyền lại.
  const me = await getCurrentUser();
  const isManager =
    me.isManager ||
    me.employee?.role === "LEAD" ||
    me.employee?.dept === "ADMIN";
  return <AppShell isManager={isManager}>{children}</AppShell>;
}
