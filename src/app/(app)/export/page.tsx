import { FileDown } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Xuất báo cáo" };

export default function ExportPage() {
  return (
    <PagePlaceholder
      icon={FileDown}
      title="Xuất báo cáo"
      description="Màn xuất báo cáo Excel/Word sẽ được dựng ở giai đoạn sau (tạm hoãn theo yêu cầu). Các màn còn lại đã hoàn thiện để duyệt design."
      phase="giai đoạn sau"
    />
  );
}
