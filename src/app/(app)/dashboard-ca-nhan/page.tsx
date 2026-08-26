import { PersonalDashboard } from "@/components/dashboard/personal-dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getPersonalDashboards } from "@/lib/dashboard/queries";
import { getPersonalMetrics } from "@/lib/dashboard/personal-metrics";
import type { ConfigTab } from "@/lib/mock/reports";
import type { DeptCode } from "@/lib/mock/types";

export const metadata = { title: "Dashboard cá nhân" };
export const dynamic = "force-dynamic";

/** Tab báo cáo "của" mỗi bộ phận. ADMIN/LEAD không gắn tab nào nên bỏ trống. */
const TAB_BY_DEPT: Partial<Record<DeptCode, ConfigTab>> = {
  SALE: "SALE",
  CSKH: "CSKH",
  LIVESTREAM: "LIVESTREAM",
};

export default async function PersonalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const me = await getCurrentUser();
  const fullAccess =
    me.isManager ||
    me.employee?.role === "LEAD" ||
    me.employee?.dept === "ADMIN";

  // Nhân viên thường chỉ xem được chính mình (PM chốt 2026-07-31c).
  const onlyCodes =
    fullAccess || !me.employee?.code ? undefined : [me.employee.code];

  const { people, idByCode, month, monthLabel, availableMonths } =
    await getPersonalDashboards(onlyCodes, monthParam);

  // Chỉ số chi tiết của tất cả người xem được — 4 truy vấn, gom sẵn theo code
  // để client đổi người là hiện ngay, không phải gọi lại server.
  const byUuid = await getPersonalMetrics(
    people.map((p) => idByCode[p.code]).filter(Boolean),
    month,
  );

  // CHỈ giữ khối chỉ số của tab thuộc BỘ PHẬN CHÍNH của người đó.
  // Người kiêm nhiều tổ (Chinh/Phương là CSKH có nhập hộ số liệu Sale) chỉ được
  // hiện doanh số tổ gốc — phần nhập hộ đã cộng vào tổng tổ Sale ở Trang chủ,
  // hiện thêm ở đây nữa là thành cộng hai lần vào thành tích cá nhân
  // (khách chốt 2026-08-26). Xem lại số đã nhập hộ thì vào thẳng tab đó.
  const metricsByCode = Object.fromEntries(
    people.map((p) => {
      const own = TAB_BY_DEPT[p.dept];
      const groups = byUuid[idByCode[p.code]] ?? [];
      return [p.code, own ? groups.filter((g) => g.tab === own) : groups];
    }),
  );

  return (
    <PersonalDashboard
      data={people}
      metricsByCode={metricsByCode}
      month={month}
      monthLabel={monthLabel}
      availableMonths={availableMonths}
      lockedToSelf={!fullAccess}
    />
  );
}
