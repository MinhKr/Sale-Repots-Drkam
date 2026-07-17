import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client dùng ở SERVER COMPONENT / SERVER ACTION.
 *
 * Đọc phiên đăng nhập từ cookie để DB biết "ai đang gọi" — RLS dựa vào đó.
 * Vẫn dùng anon key (KHÔNG dùng service role ở đây), nên mọi truy vấn
 * vẫn bị RLS kiểm soát. Đó là điều mình muốn.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Gọi từ Server Component thì không set cookie được — bỏ qua.
            // Middleware đã lo việc làm mới phiên nên không sao.
          }
        },
      },
    },
  );
}
