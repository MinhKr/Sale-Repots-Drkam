import { Megaphone } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Báo cáo Marketing" };

export default function MktReportPage() {
  return (
    <PagePlaceholder
      icon={Megaphone}
      title="Báo cáo Marketing"
      description="Form nhập chỉ số Marketing (Lead nhập hộ) sẽ được dựng trên dữ liệu giả."
      phase="Phiên 3"
    />
  );
}
