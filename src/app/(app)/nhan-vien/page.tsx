import { notFound } from "next/navigation";
import { EmployeeAdmin } from "@/components/employees/employee-admin";
import { getCurrentUser } from "@/lib/auth";
import { listEmployeeAccounts } from "@/lib/employees/queries";

export const metadata = { title: "Quản lý nhân viên" };
export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  // Chặn ngay ở trang: người không phải quản lý gõ thẳng URL cũng không vào được.
  // (Các action bên trong vẫn tự gọi requireManager() — không tin mỗi lớp này.)
  const current = await getCurrentUser();
  if (!current.isManager) notFound();

  const rows = await listEmployeeAccounts();

  // Không có service role key thì mọi thao tác cấp tài khoản sẽ hỏng — báo
  // trước ở giao diện thay vì để người dùng bấm rồi mới thấy lỗi khó hiểu.
  const serviceKeyReady = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return <EmployeeAdmin rows={rows} serviceKeyReady={serviceKeyReady} />;
}
