import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Client Drizzle dùng chung cho server (Server Actions / seed).
 * Dùng singleton để tránh mở nhiều connection khi Next.js hot-reload ở dev.
 */
const globalForDb = globalThis as unknown as {
  _pg?: ReturnType<typeof postgres>;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL chưa được thiết lập (xem .env.example / bước 7.1).");
}

const client = globalForDb._pg ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb._pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
