import { Target } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Cấu hình KPI" };

export default function KpiPage() {
  return (
    <PagePlaceholder
      icon={Target}
      title="Cấu hình KPI"
      description="Form cấu hình mục tiêu KPI theo tháng cho từng bộ phận/nhân viên."
      phase="Phiên 5"
    />
  );
}
