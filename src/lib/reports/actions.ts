"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { requireUser } from "@/lib/auth";
import { assertCanEditFor, loadEditScope } from "./guard";
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
  const obj = z.object(shape);
  if (tab !== "SAO_XAU") return obj;

  // "Khách có SĐT" là một phần CỦA "Sao xấu mới", không thể nhiều hơn — nếu
  // không chặn thì ô tự tính "Không có SĐT" bị âm và tổng quan sai theo.
  return obj.refine(
    (v) => (v.newBadWithPhone ?? 0) <= (v.newBad ?? 0),
    {
      path: ["newBadWithPhone"],
      message: "Số case có SĐT không được lớn hơn Sao xấu mới",
    },
  );
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
    id: z.string().uuid().optional(),
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
 *
 * `input.id` = dòng đang sửa. BẮT BUỘC gửi lên khi sửa, vì khóa upsert là
 * (employee_id, report_date): đổi nhân viên hoặc đổi ngày mà không có id thì
 * upsert sẽ đẻ ra dòng MỚI và dòng cũ nằm lại → nhân đôi báo cáo.
 *
 * 🔴 Đã xảy ra thật 2026-08-19: khách sửa báo cáo Sao Xấu 19/08 từ Phương sang
 * Hương, kết quả DB có cả 2 dòng. Càng khó phát hiện vì client tự gỡ dòng cũ
 * khỏi state nên nhìn màn hình tưởng đã chuyển xong, tải lại trang mới lòi ra.
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

  // Chặn quyền: chỉ được ghi cho nhân viên trong phạm vi của mình.
  await assertCanEditFor(tab, employeeUuid);

  const table = reportTable(tab);
  const record = buildDbRecord(
    tab,
    employeeUuid,
    parsed.date,
    parsed.values as Record<string, number>,
    parsed.note,
    parsed.texts as Record<string, string> | undefined,
  );

  const upsert = (exec: typeof db) =>
    exec
      .insert(table)
      .values(record)
      .onConflictDoUpdate({
        target: [table.employeeId, table.reportDate],
        set: buildUpdateSet(record),
      })
      .returning();

  // Đang sửa và khóa (nhân viên, ngày) bị đổi → DỜI dòng: xóa dòng cũ rồi ghi
  // dòng mới trong cùng 1 transaction, để không có lúc nào tồn tại cả hai.
  let moveFromId: string | null = null;
  if (parsed.id) {
    const [old] = await db
      .select({ id: table.id, employeeId: table.employeeId, date: table.reportDate })
      .from(table)
      .where(eq(table.id, parsed.id))
      .limit(1);
    if (
      old &&
      (old.employeeId !== employeeUuid || (old.date as string) !== parsed.date)
    ) {
      // Xóa dòng của người khác cũng là hành vi ghi → phải có quyền trên CẢ hai.
      await assertCanEditFor(tab, old.employeeId as string);
      moveFromId = old.id as string;
    }
  }

  const [saved] = moveFromId
    ? await db.transaction(async (tx) => {
        await tx.delete(table).where(eq(table.id, moveFromId));
        return upsert(tx as unknown as typeof db);
      })
    : await upsert(db);

  revalidatePath(TAB_PATH[tab]);
  return toReportRow(tab, saved as Record<string, unknown>, idToCode);
}

/** Xóa 1 báo cáo theo id. */
export async function deleteReport(tab: ConfigTab, id: string): Promise<void> {
  await requireUser();
  z.string().uuid().parse(id);

  const table = reportTable(tab);

  // Phải biết dòng này của AI rồi mới xét quyền — không xóa mù theo id.
  const [row] = await db
    .select({ employeeId: table.employeeId })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  if (!row) return; // đã bị xóa trước đó — coi như xong
  await assertCanEditFor(tab, row.employeeId as string);

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

  // Phạm vi được sửa: fulltime chỉ nhập cho mình + parttime cùng miền.
  const { editableIds } = await loadEditScope(tab);
  if (editableIds.size === 0) {
    throw new Error("Bạn không có quyền nhập báo cáo Livestream.");
  }

  // Mọi dòng gửi lên phải nằm trong phạm vi — sai 1 dòng là từ chối cả lượt.
  const scopedEntries = parsedEntries.map((e) => {
    const uuid = codeToId.get(e.employeeCode);
    if (!uuid) throw new Error(`Nhân viên không tồn tại: ${e.employeeCode}`);
    if (!editableIds.has(uuid)) {
      throw new Error("Bạn không có quyền nhập báo cáo cho nhân viên này.");
    }
    return { uuid, values: e.values as Record<string, number>, note: e.note };
  });

  // Chỉ giữ dòng có ít nhất 1 ô > 0 (khớp hành vi UI cũ).
  const records = scopedEntries
    .filter((e) => config.inputs.some((f) => (e.values[f.key] ?? 0) > 0))
    .map((e) => buildDbRecord(tab, e.uuid, d, e.values, e.note));

  const table = reportTable(tab);
  const scopedIds = [...editableIds];
  await db.transaction(async (tx) => {
    // ⚠️ Xóa-rồi-chèn PHẢI giới hạn trong phạm vi của người đang nhập. Nếu xóa
    // cả ngày, một bạn fulltime miền Bắc bấm lưu sẽ xóa mất báo cáo miền Nam.
    await tx
      .delete(table)
      .where(
        and(eq(table.reportDate, d), inArray(table.employeeId, scopedIds)),
      );
    if (records.length) await tx.insert(table).values(records);
  });

  revalidatePath(TAB_PATH[tab]);
  return listInternal(tab);
}
