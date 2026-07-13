import { Radio } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Báo cáo Livestream" };

export default function LivestreamReportPage() {
  return (
    <PagePlaceholder
      icon={Radio}
      title="Báo cáo Livestream"
      description="Nhập nhanh (bulk) 6 dòng Livestream do Lead nhập hộ, trên dữ liệu giả."
      phase="Phiên 3"
    />
  );
}
