import { bigint, date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { contactChannelEnum, wholesaleStageEnum } from "./enums";
import { employees } from "./employees";

/**
 * Pipeline khách sỉ. Khớp src/lib/mock/wholesale.ts.
 * wholesale_customers 1-n wholesale_contact_logs.
 */
export const wholesaleCustomers = pgTable("wholesale_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone"),
  /** NV phụ trách */
  assignedTo: uuid("assigned_to")
    .notNull()
    .references(() => employees.id),
  /** Giá trị tiềm năng (VND) */
  potentialValue: bigint("potential_value", { mode: "number" }).notNull().default(0),
  stage: wholesaleStageEnum("stage").notNull().default("moi"),
  createdDate: date("created_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const wholesaleContactLogs = pgTable("wholesale_contact_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => wholesaleCustomers.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  channel: contactChannelEnum("channel").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const wholesaleCustomersRelations = relations(wholesaleCustomers, ({ one, many }) => ({
  assignee: one(employees, {
    fields: [wholesaleCustomers.assignedTo],
    references: [employees.id],
  }),
  logs: many(wholesaleContactLogs),
}));

export const wholesaleContactLogsRelations = relations(wholesaleContactLogs, ({ one }) => ({
  customer: one(wholesaleCustomers, {
    fields: [wholesaleContactLogs.customerId],
    references: [wholesaleCustomers.id],
  }),
}));

export type WholesaleCustomer = typeof wholesaleCustomers.$inferSelect;
export type WholesaleContactLog = typeof wholesaleContactLogs.$inferSelect;
