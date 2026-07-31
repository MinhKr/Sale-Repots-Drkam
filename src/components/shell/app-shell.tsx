"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Header } from "./header";
import { SidebarBrand, SidebarNav } from "./sidebar";

export function AppShell({
  children,
  isManager = false,
}: {
  children: React.ReactNode;
  /** Quyết định có hiện các mục menu dành riêng cho quản lý hay không */
  isManager?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar cố định — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar lg:flex">
        <SidebarBrand />
        <SidebarNav isManager={isManager} />
      </aside>

      {/* Sidebar dạng Sheet — mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 gap-0 border-sidebar-border bg-sidebar p-0 [&>button]:text-sidebar-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Điều hướng</SheetTitle>
          </SheetHeader>
          <SidebarBrand />
          <SidebarNav
            isManager={isManager}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Vùng nội dung */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
