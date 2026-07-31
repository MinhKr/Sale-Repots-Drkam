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
 * Danh tính người đang đăng nhập — tính ở server rồi truyền xuống.
 *
 * Từ 2026-07-31 mỗi nhân viên có tài khoản riêng nên KHÔNG được ghi cứng
 * "Phòng Sale DrKam" nữa: đăng nhập bằng nick nào thì hiện đúng tên người đó.
 * Tài khoản chung của phòng (chưa gắn với nhân viên nào) mới hiện tên phòng.
 */
export interface SessionUser {
  name: string;
  email: string;
  initials: string;
  /** Nhãn phụ dưới tên trong menu, vd "Livestream · Miền Bắc" */
  subtitle?: string;
}

export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { name: ACCOUNT_NAME, email: ACCOUNT_EMAIL, initials: ACCOUNT_INITIALS } = user;

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
            {user.subtitle && (
              <span className="block text-xs font-normal text-muted-foreground">
                {user.subtitle}
              </span>
            )}
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
