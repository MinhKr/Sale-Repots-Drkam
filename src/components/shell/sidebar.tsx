"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SidebarBrand() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
      <div className="flex size-8 items-center justify-center rounded-md bg-white font-heading text-lg font-extrabold text-brand-600">
        D
      </div>
      <div className="leading-tight">
        <p className="font-heading text-sm font-bold text-white">DrKam</p>
        <p className="text-[10px] tracking-wide text-sidebar-foreground/60">
          SALES REPORT
        </p>
      </div>
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.title && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarFooter() {
  return (
    <div className="shrink-0 border-t border-sidebar-border px-5 py-3">
      <p className="text-[11px] leading-relaxed text-sidebar-foreground/55">
        Bản demo UI · dữ liệu giả
      </p>
    </div>
  );
}
