import { PersonalDashboard } from "@/components/dashboard/personal-dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getPersonalDashboards } from "@/lib/dashboard/queries";
import { getPersonalMetrics } from "@/lib/dashboard/personal-metrics";

export const metadata = { title: "Dashboard cá nhân" };
export const dynamic = "force-dynamic";

export default async function PersonalDashboardPage() {
  const me = await getCurrentUser();
  const fullAccess =
    me.isManager ||
    me.employee?.role === "LEAD" ||
    me.employee?.dept === "ADMIN";

  // Nhân viên thường chỉ xem được chính mình (PM chốt 2026-07-31c).
  const onlyCodes =
    fullAccess || !me.employee?.code ? undefined : [me.employee.code];

  const { people, idByCode, month, monthLabel } =
    await getPersonalDashboards(onlyCodes);

  // Chỉ số chi tiết của tất cả người xem được — 4 truy vấn, gom sẵn theo code
  // để client đổi người là hiện ngay, không phải gọi lại server.
  const byUuid = await getPersonalMetrics(
    people.map((p) => idByCode[p.code]).filter(Boolean),
    month,
  );
  const metricsByCode = Object.fromEntries(
    people.map((p) => [p.code, byUuid[idByCode[p.code]] ?? []]),
  );

  return (
    <PersonalDashboard
      data={people}
      metricsByCode={metricsByCode}
      monthLabel={monthLabel}
      lockedToSelf={!fullAccess}
    />
  );
}
