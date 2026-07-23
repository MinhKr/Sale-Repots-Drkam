"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getEmployeeMaps } from "@/lib/reports/shared";
import type { ContactLog, WholesaleCustomer } from "@/lib/mock/wholesale";

const stageSchema = z.enum(["moi", "tu-van", "bao-gia", "dam-phan", "chot"]);
const channelSchema = z.enum(["call", "zalo", "meet", "email"]);
const idSchema = z.string().uuid();
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (yyyy-mm-dd)");

/** Dữ liệu form khách sỉ (thêm mới / sửa). */
const customerSchema = z.object({
  company: z.string().trim().min(1, "Thiếu tên công ty").max(200),
  contactName: z.string().trim().min(1, "Thiếu người liên hệ").max(120),
  phone: z.string().trim().max(40).optional().default(""),
  assigneeCode: z.string().min(1, "Thiếu NV phụ trách"),
  potentialValue: z.number().int().min(0),
  stage: stageSchema,
  createdDate: dateSchema,
});

/** Đổi giai đoạn 1 khách trong pipeline. */
export async function setStage(customerId: unknown, stage: unknown): Promise<void> {
  await requireUser();
  const id = idSchema.parse(customerId);
  const s = stageSchema.parse(stage);

  await db
    .update(schema.wholesaleCustomers)
    .set({ stage: s, updatedAt: new Date() })
    .where(eq(schema.wholesaleCustomers.id, id));

  revalidatePath("/pipeline");
}

/** Thêm 1 log liên hệ cho khách; trả về log vừa tạo để client chèn vào timeline. */
export async function addContactLog(
  customerId: unknown,
  channel: unknown,
  note: unknown,
): Promise<ContactLog> {
  await requireUser();
  const id = idSchema.parse(customerId);
  const ch = channelSchema.parse(channel);
  const text = z.string().min(1).max(2000).parse(note);
  const today = new Date().toISOString().slice(0, 10);

  const [row] = await db
    .insert(schema.wholesaleContactLogs)
    .values({ customerId: id, logDate: today, channel: ch, note: text })
    .returning();

  revalidatePath("/pipeline");
  return { id: row.id, date: row.logDate, channel: row.channel, note: row.note };
}

/** Thêm khách sỉ mới; trả về khách vừa tạo (logs rỗng) để client chèn vào board. */
export async function createCustomer(input: unknown): Promise<WholesaleCustomer> {
  await requireUser();
  const data = customerSchema.parse(input);

  const { codeToId } = await getEmployeeMaps();
  const assignedTo = codeToId.get(data.assigneeCode);
  if (!assignedTo) throw new Error("NV phụ trách không tồn tại.");

  const [row] = await db
    .insert(schema.wholesaleCustomers)
    .values({
      company: data.company,
      contactName: data.contactName,
      phone: data.phone || null,
      assignedTo,
      potentialValue: data.potentialValue,
      stage: data.stage,
      createdDate: data.createdDate,
    })
    .returning();

  revalidatePath("/pipeline");
  return {
    id: row.id,
    company: row.company,
    contactName: row.contactName,
    phone: row.phone ?? "",
    assignedTo: data.assigneeCode,
    potentialValue: Number(row.potentialValue),
    stage: row.stage,
    archived: row.archived,
    createdDate: row.createdDate,
    logs: [],
  };
}

/** Lưu trữ / bỏ lưu trữ 1 khách (ẩn/hiện khỏi board pipeline). */
export async function setArchived(
  customerId: unknown,
  archived: unknown,
): Promise<void> {
  await requireUser();
  const id = idSchema.parse(customerId);
  const flag = z.boolean().parse(archived);

  await db
    .update(schema.wholesaleCustomers)
    .set({ archived: flag, updatedAt: new Date() })
    .where(eq(schema.wholesaleCustomers.id, id));

  revalidatePath("/pipeline");
}

/** Cập nhật thông tin 1 khách sỉ. Trả về các trường đã lưu (không đụng logs). */
export async function updateCustomer(
  customerId: unknown,
  input: unknown,
): Promise<Omit<WholesaleCustomer, "logs">> {
  await requireUser();
  const id = idSchema.parse(customerId);
  const data = customerSchema.parse(input);

  const { codeToId } = await getEmployeeMaps();
  const assignedTo = codeToId.get(data.assigneeCode);
  if (!assignedTo) throw new Error("NV phụ trách không tồn tại.");

  const [row] = await db
    .update(schema.wholesaleCustomers)
    .set({
      company: data.company,
      contactName: data.contactName,
      phone: data.phone || null,
      assignedTo,
      potentialValue: data.potentialValue,
      stage: data.stage,
      createdDate: data.createdDate,
      updatedAt: new Date(),
    })
    .where(eq(schema.wholesaleCustomers.id, id))
    .returning();

  revalidatePath("/pipeline");
  return {
    id: row.id,
    company: row.company,
    contactName: row.contactName,
    phone: row.phone ?? "",
    assignedTo: data.assigneeCode,
    potentialValue: Number(row.potentialValue),
    stage: row.stage,
    archived: row.archived,
    createdDate: row.createdDate,
  };
}

/** Xóa 1 khách sỉ (cascade xóa cả log liên hệ). */
export async function deleteCustomer(customerId: unknown): Promise<void> {
  await requireUser();
  const id = idSchema.parse(customerId);
  await db
    .delete(schema.wholesaleCustomers)
    .where(eq(schema.wholesaleCustomers.id, id));
  revalidatePath("/pipeline");
}
