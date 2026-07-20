import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { listWholesale } from "@/lib/wholesale/queries";

export const metadata = { title: "Pipeline khách sỉ" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const customers = await listWholesale();
  return <PipelineBoard initialCustomers={customers} />;
}
