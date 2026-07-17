import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Nạp biến môi trường từ .env.local cho mọi lệnh drizzle-kit (generate/push/migrate/studio).
config({ path: ".env.local" });

/**
 * Cấu hình Drizzle Kit — sinh migration + push schema lên Supabase (Postgres).
 * DATABASE_URL lấy từ .env.local (không commit). Xem .env.example.
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
