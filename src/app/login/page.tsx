"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Mock: chưa có auth thật (Giai đoạn 2). Vào thẳng trang chủ.
    router.push("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-white font-heading text-3xl font-extrabold text-brand-600 shadow-lg">
            D
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-white">
              Sales Report DrKam
            </h1>
            <p className="text-sm text-white/70">Web nội bộ phòng Sale</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập tài khoản được cấp để vào hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ten@drkam.vn"
                  defaultValue="lehoaily@drkam.vn"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue="demo1234"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="size-4" />
                {loading ? "Đang vào..." : "Đăng nhập"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Bản demo UI — bấm Đăng nhập để xem giao diện với dữ liệu giả.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
