import { Headset } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Báo cáo CSKH" };

export default function CskhReportPage() {
  return (
    <PagePlaceholder
      icon={Headset}
      title="Báo cáo CSKH"
      description="Danh sách và form nhập báo cáo chăm sóc khách hàng, cùng cơ chế tự tính chỉ số trên dữ liệu giả."
      phase="Phiên 2"
    />
  );
}
