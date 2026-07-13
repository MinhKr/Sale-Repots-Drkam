import { UserRound } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Dashboard cá nhân" };

export default function PersonalDashboardPage() {
  return (
    <PagePlaceholder
      icon={UserRound}
      title="Dashboard cá nhân"
      description="Chọn nhân viên để xem biểu đồ Recharts theo cá nhân, dựa trên dữ liệu giả."
      phase="Phiên 4"
    />
  );
}
