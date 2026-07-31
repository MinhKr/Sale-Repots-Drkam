import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";
import { hasFullAccessNow } from "@/lib/auth";

export const metadata = { title: "Xuất báo cáo" };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  // Xuất báo cáo dành cho Lead/Admin — nhân viên thường không vào.
  if (!(await hasFullAccessNow())) notFound();

  return (
    <PagePlaceholder
      icon={FileDown}
      title="Xuất báo cáo"
      description="Màn xuất báo cáo Excel/Word sẽ được dựng ở giai đoạn sau (tạm hoãn theo yêu cầu). Các màn còn lại đã hoàn thiện để duyệt design."
      phase="giai đoạn sau"
    />
  );
}
