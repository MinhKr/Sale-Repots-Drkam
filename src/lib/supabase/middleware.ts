import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Các route xem được khi CHƯA đăng nhập */
const PUBLIC_PATHS = ["/login", "/auth"];

/**
 * Làm mới phiên đăng nhập + chặn route cho người chưa đăng nhập.
 *
 * ⚠️ Lưu ý quan trọng: chặn route ở đây là để TRẢI NGHIỆM (đá về /login cho gọn),
 * KHÔNG phải lớp bảo mật. Ai cũng có thể gọi thẳng API Supabase bỏ qua Next.js.
 * Lớp bảo vệ thật sự là RLS trong DB — xem drizzle/0002_rls.sql.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // PHẢI dùng getUser() (xác thực với server Supabase), KHÔNG dùng getSession()
  // — getSession() chỉ đọc cookie nên có thể bị giả mạo.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Chưa đăng nhập mà vào trang nội bộ → đá về /login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Đã đăng nhập mà còn vào /login → đưa thẳng vào trang chủ
  if (user && path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
