import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingBag,
  Headset,
  Star,
  Radio,
  UserRound,
  Workflow,
  Target,
  FileDown,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Chỉ hiện với người có toàn quyền: tài khoản chung của phòng, Lead,
   * hoặc Admin. Nhân viên thường không thấy mục này.
   */
  managerOnly?: boolean;
}

export interface NavGroup {
  /** Tiêu đề nhóm (null = không hiển thị tiêu đề) */
  title: string | null;
  items: NavItem[];
}

/** Cấu trúc điều hướng — 10 màn theo lộ trình (Marketing đã gỡ 2026-07-31) */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [{ label: "Trang chủ", href: "/home", icon: LayoutDashboard }],
  },
  {
    title: "Báo cáo",
    items: [
      { label: "Sale", href: "/reports/sale", icon: ShoppingBag },
      { label: "CSKH", href: "/reports/cskh", icon: Headset },
      { label: "Sao Xấu", href: "/reports/sao-xau", icon: Star },
      { label: "Livestream", href: "/reports/livestream", icon: Radio },
    ],
  },
  {
    title: "Phân tích",
    items: [
      { label: "Dashboard cá nhân", href: "/dashboard-ca-nhan", icon: UserRound },
      { label: "Pipeline khách sỉ", href: "/pipeline", icon: Workflow },
    ],
  },
  {
    title: "Quản trị",
    items: [
      {
        label: "Quản lý nhân viên",
        href: "/nhan-vien",
        icon: Users,
        managerOnly: true,
      },
      {
        label: "Cấu hình KPI",
        href: "/kpi",
        icon: Target,
        managerOnly: true,
      },
      { label: "Xuất báo cáo", href: "/export", icon: FileDown },
    ],
  },
];

/** Lọc menu theo quyền — nhóm nào rỗng sau khi lọc thì bỏ luôn. */
export function navGroupsFor(isManager: boolean): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.managerOnly || isManager),
  })).filter((g) => g.items.length > 0);
}
