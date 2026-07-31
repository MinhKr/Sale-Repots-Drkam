import { notFound } from "next/navigation";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { listWholesale } from "@/lib/wholesale/queries";
import { hasFullAccessNow } from "@/lib/auth";

export const metadata = { title: "Pipeline khách sỉ" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  // Pipeline khách sỉ dành cho Lead/Admin — nhân viên thường không vào.
  if (!(await hasFullAccessNow())) notFound();

  const customers = await listWholesale();
  return <PipelineBoard initialCustomers={customers} />;
}
