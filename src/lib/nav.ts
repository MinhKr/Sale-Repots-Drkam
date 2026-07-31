import type { LucideIcon } from "lucide-react";
import type { ConfigTab } from "@/lib/mock/reports";
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
  /**
   * Mục là tab báo cáo của tab nào — dùng để chỉ hiện tab thuộc bộ phận
   * của người đang đăng nhập.
   */
  tab?: ConfigTab;
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
      { label: "Sale", href: "/reports/sale", icon: ShoppingBag, tab: "SALE" },
      { label: "CSKH", href: "/reports/cskh", icon: Headset, tab: "CSKH" },
      {
        label: "Sao Xấu",
        href: "/reports/sao-xau",
        icon: Star,
        tab: "SAO_XAU",
      },
      {
        label: "Livestream",
        href: "/reports/livestream",
        icon: Radio,
        tab: "LIVESTREAM",
      },
    ],
  },
  {
    title: "Phân tích",
    items: [
      { label: "Dashboard cá nhân", href: "/dashboard-ca-nhan", icon: UserRound },
      {
        label: "Pipeline khách sỉ",
        href: "/pipeline",
        icon: Workflow,
        managerOnly: true,
      },
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
      {
        label: "Xuất báo cáo",
        href: "/export",
        icon: FileDown,
        managerOnly: true,
      },
    ],
  },
];

/**
 * Lọc menu theo quyền — nhóm nào rỗng sau khi lọc thì bỏ luôn.
 *
 * Nhân viên thường chỉ còn: Trang chủ · tab báo cáo của bộ phận mình ·
 * Dashboard cá nhân (PM chốt 2026-07-31c).
 */
export function navGroupsFor(
  isManager: boolean,
  /** Các tab báo cáo được vào — bỏ qua khi isManager */
  allowedTabs: ConfigTab[] = [],
): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.managerOnly && !isManager) return false;
      if (i.tab && !isManager && !allowedTabs.includes(i.tab)) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);
}
