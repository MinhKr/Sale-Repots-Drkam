import { Workflow } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Pipeline khách sỉ" };

export default function PipelinePage() {
  return (
    <PagePlaceholder
      icon={Workflow}
      title="Pipeline khách sỉ"
      description="Bảng/kanban theo dõi khách sỉ kèm log liên hệ sẽ được dựng trên dữ liệu giả."
      phase="Phiên 4"
    />
  );
}
