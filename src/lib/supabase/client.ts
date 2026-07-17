import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client dùng ở CLIENT COMPONENT (chạy trong trình duyệt).
 *
 * Chỉ dùng anon key — đây là key CÔNG KHAI, ai cũng xem được trong source.
 * Nó không phải mật khẩu: nó chỉ nói "tôi là app DrKam".
 * Thứ quyết định được xem dữ liệu gì là PHIÊN ĐĂNG NHẬP + RLS ở phía DB.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
