import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client dùng SERVICE ROLE KEY — có toàn quyền, BỎ QUA RLS.
 *
 * 🔴 CHỈ được dùng trong Server Action / route handler chạy ở server, và chỉ
 * sau khi đã gọi `requireManager()`. Key này lộ ra client là mất sạch dữ liệu.
 *
 * Vì vậy: KHÔNG import file này từ bất kỳ file nào có "use client", và biến
 * môi trường cố tình KHÔNG có tiền tố NEXT_PUBLIC_ để Next.js không nhúng
 * vào bundle trình duyệt.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() chỉ được gọi ở server — service role key không được ra client.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
