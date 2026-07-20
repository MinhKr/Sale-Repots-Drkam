"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, RotateCcw, UserCog } from "lucide-react";
import { clearAllLocalData } from "@/lib/use-local-storage-state";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
/**
 * Tài khoản dùng chung cho cả phòng Sale (1 nick, không phải cá nhân).
 * Hiển thị danh tính tài khoản — không lấy tên/nhãn của nhân sự mock.
 */
const ACCOUNT_NAME = "Phòng Sale DrKam";
const ACCOUNT_EMAIL = "sale@drkam.vn";
const ACCOUNT_INITIALS = "PS";

export function UserMenu() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarFallback className="bg-brand-500 text-sm font-semibold text-white">
            {ACCOUNT_INITIALS}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-medium">{ACCOUNT_NAME}</p>
          <p className="text-xs text-muted-foreground">{ACCOUNT_EMAIL}</p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block font-medium">{ACCOUNT_NAME}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {ACCOUNT_EMAIL}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserCog className="size-4" />
          Tài khoản
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            clearAllLocalData();
            window.location.reload();
          }}
        >
          <RotateCcw className="size-4" />
          Xóa dữ liệu tạm
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            // Xóa phiên ở cả trình duyệt lẫn cookie server, rồi mới rời trang.
            await createClient().auth.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
