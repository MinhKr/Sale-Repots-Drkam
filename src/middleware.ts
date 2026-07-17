import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Chạy trên mọi route TRỪ:
     * - _next/static, _next/image (asset build)
     * - favicon, file ảnh
     * Để middleware làm mới phiên trên mọi điều hướng.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
