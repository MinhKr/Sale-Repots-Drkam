import { PersonalDashboard } from "@/components/dashboard/personal-dashboard";
import { getPersonalDashboards } from "@/lib/dashboard/queries";

export const metadata = { title: "Dashboard cá nhân" };
export const dynamic = "force-dynamic";

export default async function PersonalDashboardPage() {
  const data = await getPersonalDashboards();
  return <PersonalDashboard data={data} />;
}
