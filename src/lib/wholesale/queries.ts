import { db } from "@/db";
import type { WholesaleCustomer } from "@/lib/mock/wholesale";

/**
 * Danh sách khách sỉ + log liên hệ (P10). Trả đúng shape mock `WholesaleCustomer`
 * (assignedTo = mã NV) để UI dùng lại. 1 truy vấn quan hệ (customers + logs + NV).
 */
export async function listWholesale(): Promise<WholesaleCustomer[]> {
  const rows = await db.query.wholesaleCustomers.findMany({
    with: {
      logs: true,
      assignee: { columns: { code: true } },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    company: c.company,
    contactName: c.contactName,
    phone: c.phone ?? "",
    assignedTo: c.assignee?.code ?? c.assignedTo,
    potentialValue: Number(c.potentialValue),
    stage: c.stage,
    archived: c.archived,
    createdDate: c.createdDate,
    logs: c.logs.map((l) => ({
      id: l.id,
      date: l.logDate,
      channel: l.channel,
      note: l.note,
    })),
  }));
}
