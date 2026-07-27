"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { requireUser } from "@/lib/auth";
import {
  CONFIG_BY_TAB,
  type ConfigTab,
  type ReportRow,
} from "@/lib/mock/reports";
import {
  buildDbRecord,
  buildUpdateSet,
  getEmployeeMaps,
  reportTable,
  toReportRow,
} from "./shared";

/** Route cần revalidate sau mỗi lần ghi (để điều hướng lại thấy dữ liệu mới). */
const TAB_PATH: Record<ConfigTab, string> = {
  SALE: "/reports/sale",
  CSKH: "/reports/cskh",
  SAO_XAU: "/reports/sao-xau",
  LIVESTREAM: "/reports/livestream",
  MKT: "/reports/mkt",
};

const nonNegNumber = z
  .number()
  .refine((n) => Number.isFinite(n) && n >= 0, "Giá trị phải là số ≥ 0");
const nonNegInt = z
  .number()
  .refine(
    (n) => Number.isInteger(n) && n >= 0,
    "Giá trị phải là số nguyên ≥ 0",
  );

/** Zod schema cho phần `values` — theo đúng ô nhập của từng tab. */
function valuesSchema(tab: ConfigTab) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of CONFIG_BY_TAB[tab].inputs) {
    shape[f.key] = f.kind === "float" ? nonNegNumber : nonNegInt;
  }
  return z.object(shape);
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (yyyy-mm-dd)");

/** Zod schema cho phần `texts` — theo đúng ô nhập chữ của từng tab. */
function textsSchema(tab: ConfigTab) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of CONFIG_BY_TAB[tab].textInputs ?? []) {
    shape[f.key] = z.string().max(2000).optional();
  }
  return z.object(shape).optional();
}

function reportInputSchema(tab: ConfigTab) {
  return z.object({
    employeeCode: z.string().min(1, "Thiếu nhân viên"),
    date: dateSchema,
    values: valuesSchema(tab),
    texts: textsSchema(tab),
    note: z.string().max(2000).optional(),
  });
}

/** Danh sách nội bộ (đã kiểm phiên ở caller) — dùng để trả về sau khi ghi. */
async function listInternal(tab: ConfigTab): Promise<ReportRow[]> {
  const table = reportTable(tab);
  const { idToCode } = await getEmployeeMaps();
  const rows = await db.select().from(table).orderBy(desc(table.reportDate));
  return rows.map((r: Record<string, unknown>) => toReportRow(tab, r, idToCode));
}

/**
 * Tạo/cập nhật 1 báo cáo (upsert theo (employee_id, report_date)).
 * 1 NV chỉ 1 báo cáo / ngày / tab — nhập lại cùng ngày sẽ ghi đè.
 */
export async function saveReport(
  tab: ConfigTab,
  input: unknown,
): Promise<ReportRow> {
  await requireUser();

  const parsed = reportInputSchema(tab).parse(input);
  const { codeToId, idToCode } = await getEmployeeMaps();
  const employeeUuid = codeToId.get(parsed.employeeCode);
  if (!employeeUuid) throw new Error("Nhân viên không tồn tại.");

  const table = reportTable(tab);
  const record = buildDbRecord(
    tab,
    employeeUuid,
    parsed.date,
    parsed.values as Record<string, number>,
    parsed.note,
    parsed.texts as Record<string, string> | undefined,
  );

  const [saved] = await db
    .insert(table)
    .values(record)
    .onConflictDoUpdate({
      target: [table.employeeId, table.reportDate],
      set: buildUpdateSet(record),
    })
    .returning();

  revalidatePath(TAB_PATH[tab]);
  return toReportRow(tab, saved as Record<string, unknown>, idToCode);
}

/** Xóa 1 báo cáo theo id. */
export async function deleteReport(tab: ConfigTab, id: string): Promise<void> {
  await requireUser();
  z.string().uuid().parse(id);

  const table = reportTable(tab);
  await db.delete(table).where(eq(table.id, id));
  revalidatePath(TAB_PATH[tab]);
}

/**
 * Lưu bulk báo cáo Livestream cho 1 ngày (Lead nhập hộ cả ca).
 * Ghi đè toàn bộ ngày: xóa hết dòng của ngày đó rồi chèn lại các dòng có dữ liệu.
 * Trả về danh sách Livestream mới nhất để client cập nhật bảng.
 */
export async function saveLivestreamDay(
  date: string,
  entries: unknown,
): Promise<ReportRow[]> {
  await requireUser();

  const tab: ConfigTab = "LIVESTREAM";
  const d = dateSchema.parse(date);
  const parsedEntries = z
    .array(
      z.object({
        employeeCode: z.string().min(1),
        values: valuesSchema(tab),
        note: z.string().max(2000).optional(),
      }),
    )
    .parse(entries);

  const { codeToId } = await getEmployeeMaps();
  const config = CONFIG_BY_TAB[tab];

  // Chỉ giữ dòng có ít nhất 1 ô > 0 (khớp hành vi UI cũ).
  const records = parsedEntries
    .map((e) => ({ ...e, values: e.values as Record<string, number> }))
    .filter((e) => config.inputs.some((f) => (e.values[f.key] ?? 0) > 0))
    .map((e) => {
      const uuid = codeToId.get(e.employeeCode);
      if (!uuid) throw new Error(`Nhân viên không tồn tại: ${e.employeeCode}`);
      return buildDbRecord(tab, uuid, d, e.values, e.note);
    });

  const table = reportTable(tab);
  await db.transaction(async (tx) => {
    await tx.delete(table).where(eq(table.reportDate, d));
    if (records.length) await tx.insert(table).values(records);
  });

  revalidatePath(TAB_PATH[tab]);
  return listInternal(tab);
}
