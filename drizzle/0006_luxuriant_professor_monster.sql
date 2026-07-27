CREATE TABLE "bad_review_opening" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_bad_opening_year_month" UNIQUE("year","month")
);
--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "star_1" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "star_2" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "star_3" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "fixed_5_shopee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "fixed_5_tiktok" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "pending_shopee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "pending_tiktok" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "warehouse_issue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "no_contact" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "fixed_5_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "pending_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "review_link" text;--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD COLUMN "root_cause" text;--> statement-breakpoint

-- RLS cho bảng mới — cùng quy tắc 0002: authenticated toàn quyền, anon cấm sạch.
ALTER TABLE "bad_review_opening" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "bad_review_opening_authenticated_all" ON "bad_review_opening"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);