import { Star } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Báo cáo Sao Xấu" };

export default function SaoXauReportPage() {
  return (
    <PagePlaceholder
      icon={Star}
      title="Báo cáo Sao Xấu"
      description="Khối cảnh báo tồn lũy kế theo ngưỡng và form nhập (CSKH nhập hộ) sẽ được dựng ở phiên tới."
      phase="Phiên 3"
    />
  );
}
