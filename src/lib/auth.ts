import { createClient } from "@/lib/supabase/server";

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
