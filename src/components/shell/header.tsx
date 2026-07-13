"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS } from "@/lib/nav";
import { UserMenu } from "./user-menu";

function currentTitle(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label;
      }
    }
  }
  return "Sales Report";
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = currentTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Mở menu"
      >
        <Menu className="size-5" />
      </Button>
      <h1 className="font-heading text-base font-semibold sm:text-lg">{title}</h1>
      <div className="ml-auto flex items-center gap-1">
        <UserMenu />
      </div>
    </header>
  );
}
