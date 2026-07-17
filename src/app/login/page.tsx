"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Điểm bán hàng hiển thị ở panel thương hiệu (chỉ trang trí, ẩn trên mobile) */
const HIGHLIGHTS = [
  { icon: BarChart3, title: "Báo cáo tự động", desc: "Nhập ô vàng, số liệu tự tính" },
  { icon: Users, title: "Theo dõi cả team", desc: "KPI, xếp hạng, tiến độ mục tiêu" },
  { icon: ShieldCheck, title: "Dữ liệu nội bộ", desc: "Chỉ người được cấp mới xem được" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Không tiết lộ sai email hay sai mật khẩu — tránh dò tài khoản.
      setError("Email hoặc mật khẩu không đúng.");
      setLoading(false);
      return;
    }

    // Giữ nút ở trạng thái loading tới khi điều hướng xong — tránh nháy "Đăng nhập"
    // rồi mới chuyển trang, khiến người dùng tưởng bấm hụt.
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ============ Panel thương hiệu ============ */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-8 text-white lg:w-[46%] lg:px-12 lg:py-12">
        {/* ---------- Hoạ tiết nền (thuần CSS/SVG, không dùng file ảnh) ---------- */}

        {/* 1. Lưới chấm — gợi cảm giác dữ liệu/đo lường. Mask cho mờ dần, không phủ kín */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 75% 55% at 25% 15%, #000 20%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 55% at 25% 15%, #000 20%, transparent 78%)",
          }}
        />

        {/* 2. Đường cong mềm — nhịp tăng trưởng, rất nhạt để chữ vẫn nổi */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full opacity-[0.13]"
          viewBox="0 0 400 700"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path
            d="M-40 520 C 90 470, 150 590, 260 500 S 400 400, 460 430"
            stroke="white"
            strokeWidth="1.5"
          />
          <path
            d="M-40 570 C 90 520, 150 640, 260 550 S 400 450, 460 480"
            stroke="white"
            strokeWidth="1"
          />
          <path
            d="M-40 620 C 90 570, 150 690, 260 600 S 400 500, 460 530"
            stroke="white"
            strokeWidth="0.75"
          />
        </svg>

        {/* 3. Vòng tròn đồng tâm — điểm neo thị giác phía sau logo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-1/4 size-[34rem] rounded-full border border-white/[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-28 top-1/4 mt-16 size-[26rem] rounded-full border border-white/[0.07]"
        />

        {/* 4. Quầng sáng mờ — tạo chiều sâu */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-accent-500/20 blur-3xl"
        />

        {/* 5. Phủ tối nhẹ ở đáy — đảm bảo dòng copyright luôn đọc được */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-900/60 to-transparent"
        />

        {/* Logo + tên */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white font-heading text-2xl font-extrabold text-brand-600 shadow-lg">
            D
          </div>
          <div className="leading-tight">
            <p className="font-heading text-lg font-bold">Sales Report</p>
            <p className="text-sm text-white/70">DrKam</p>
          </div>
        </div>

        {/* Nội dung giữa — chỉ hiện trên màn lớn */}
        <div className="relative my-10 hidden lg:block">
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Báo cáo bán hàng
            <br />
            của phòng Sale
          </h2>
          <p className="mt-3 max-w-sm text-white/70">
            Nhập báo cáo hằng ngày, theo dõi KPI và doanh thu cả team ở một nơi.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <h.icon className="size-4.5" />
                </div>
                <div className="leading-snug">
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-sm text-white/60">{h.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-xs text-white/40 lg:block">
          © {new Date().getFullYear()} DrKam · Web nội bộ
        </p>
      </aside>

      {/* ============ Khu vực form ============ */}
      <main className="flex flex-1 items-center justify-center bg-background px-6 py-10 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Đăng nhập
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Nhập tài khoản được cấp để vào hệ thống.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <fieldset disabled={loading} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ten@drkam.vn"
                  autoComplete="username"
                  autoFocus
                  required
                  aria-invalid={!!error}
                  onChange={() => error && setError(null)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                    aria-invalid={!!error}
                    onChange={() => error && setError(null)}
                    onKeyUp={(e) =>
                      setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {capsLock && (
                  <p className="flex items-center gap-1.5 text-xs text-accent-600">
                    <TriangleAlert className="size-3.5 shrink-0" />
                    Đang bật Caps Lock
                  </p>
                )}
              </div>

              {/* role=alert để trình đọc màn hình đọc ngay khi lỗi xuất hiện */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-danger-500/25 bg-danger-50 p-2.5 text-sm text-danger-600"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full">
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </fieldset>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Kết nối được mã hoá · Dữ liệu nội bộ DrKam
          </p>
        </div>
      </main>
    </div>
  );
}
