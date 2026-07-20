"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import type { ContactLog } from "@/lib/mock/wholesale";

const stageSchema = z.enum(["moi", "tu-van", "bao-gia", "dam-phan", "chot"]);
const channelSchema = z.enum(["call", "zalo", "meet", "email"]);
const idSchema = z.string().uuid();

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
