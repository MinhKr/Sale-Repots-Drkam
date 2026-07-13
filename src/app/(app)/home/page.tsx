import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NAV_GROUPS } from "@/lib/nav";
import { CURRENT_USER } from "@/lib/mock/employees";

export const metadata = { title: "Trang chủ" };

const quickLinks = NAV_GROUPS.flatMap((g) => g.items).filter(
  (i) => i.href !== "/home",
);

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:p-8">
        <p className="text-sm text-white/70">Xin chào,</p>
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          {CURRENT_USER.name}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Hệ thống báo cáo phòng Sale DrKam. Chọn một mục bên dưới hoặc dùng
          thanh điều hướng để bắt đầu nhập & theo dõi báo cáo.
        </p>
      </div>

      {/* Quick access */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Truy cập nhanh
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group">
                <Card className="flex h-full flex-row items-center gap-4 p-4 transition-colors group-hover:border-brand-300 group-hover:bg-brand-50/40">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.label}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
