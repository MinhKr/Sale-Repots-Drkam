CREATE TYPE "public"."contact_channel" AS ENUM('call', 'zalo', 'meet', 'email');--> statement-breakpoint
CREATE TYPE "public"."dept" AS ENUM('SALE', 'CSKH', 'LIVESTREAM', 'MKT', 'LEAD');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STAFF', 'LEAD');--> statement-breakpoint
CREATE TYPE "public"."wholesale_stage" AS ENUM('moi', 'tu-van', 'bao-gia', 'dam-phan', 'chot');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"dept" "dept" NOT NULL,
	"role" "role" DEFAULT 'STAFF' NOT NULL,
	"initials" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"auth_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "reports_bad_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"new_bad" integer DEFAULT 0 NOT NULL,
	"resolved" integer DEFAULT 0 NOT NULL,
	"shopee" integer DEFAULT 0 NOT NULL,
	"tiktok" integer DEFAULT 0 NOT NULL,
	"lazada" integer DEFAULT 0 NOT NULL,
	"ton_ngay" integer DEFAULT 0 NOT NULL,
	"ti_le_xu_ly" numeric(7, 4) DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_bad_emp_date" UNIQUE("employee_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "reports_cskh" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"mess_received" integer DEFAULT 0 NOT NULL,
	"mess_replied" integer DEFAULT 0 NOT NULL,
	"care_calls" integer DEFAULT 0 NOT NULL,
	"reorder_count" integer DEFAULT 0 NOT NULL,
	"reorder_revenue" bigint DEFAULT 0 NOT NULL,
	"upsell_count" integer DEFAULT 0 NOT NULL,
	"upsell_revenue" bigint DEFAULT 0 NOT NULL,
	"complaints_resolved" integer DEFAULT 0 NOT NULL,
	"tong_don" integer DEFAULT 0 NOT NULL,
	"tong_doanh_thu" bigint DEFAULT 0 NOT NULL,
	"dt_tren_don" bigint DEFAULT 0 NOT NULL,
	"ti_le_phan_hoi" numeric(7, 4) DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cskh_emp_date" UNIQUE("employee_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "reports_livestream" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"hours" numeric(6, 2) DEFAULT 0 NOT NULL,
	"buyers" integer DEFAULT 0 NOT NULL,
	"revenue" bigint DEFAULT 0 NOT NULL,
	"dt_tren_gio" bigint DEFAULT 0 NOT NULL,
	"dt_tren_nguoi_mua" bigint DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_live_emp_date" UNIQUE("employee_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "reports_marketing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"ad_spend" bigint DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"messages" integer DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"revenue" bigint DEFAULT 0 NOT NULL,
	"cpl" bigint DEFAULT 0 NOT NULL,
	"cpm" bigint DEFAULT 0 NOT NULL,
	"roas" numeric(7, 4) DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_mkt_emp_date" UNIQUE("employee_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "reports_sale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"mess_received" integer DEFAULT 0 NOT NULL,
	"mess_read" integer DEFAULT 0 NOT NULL,
	"consult_calls" integer DEFAULT 0 NOT NULL,
	"zalo_new_friends" integer DEFAULT 0 NOT NULL,
	"new_orders" integer DEFAULT 0 NOT NULL,
	"new_orders_revenue" bigint DEFAULT 0 NOT NULL,
	"ladi_count" integer DEFAULT 0 NOT NULL,
	"ladi_orders" integer DEFAULT 0 NOT NULL,
	"ladi_revenue" bigint DEFAULT 0 NOT NULL,
	"tong_don" integer DEFAULT 0 NOT NULL,
	"tong_doanh_thu" bigint DEFAULT 0 NOT NULL,
	"dt_tren_don" bigint DEFAULT 0 NOT NULL,
	"ti_le_rep" numeric(7, 4) DEFAULT 0 NOT NULL,
	"ti_le_chot_ladi" numeric(7, 4) DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sale_emp_date" UNIQUE("employee_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "kpi_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" smallint NOT NULL,
	"employee_id" uuid NOT NULL,
	"target_revenue" bigint DEFAULT 0 NOT NULL,
	"warning_threshold" smallint DEFAULT 80 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_kpi_year_month_emp" UNIQUE("year","month","employee_id")
);
--> statement-breakpoint
CREATE TABLE "wholesale_contact_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesale_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"contact_name" text NOT NULL,
	"phone" text,
	"assigned_to" uuid NOT NULL,
	"potential_value" bigint DEFAULT 0 NOT NULL,
	"stage" "wholesale_stage" DEFAULT 'moi' NOT NULL,
	"created_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports_bad_review" ADD CONSTRAINT "reports_bad_review_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports_cskh" ADD CONSTRAINT "reports_cskh_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports_livestream" ADD CONSTRAINT "reports_livestream_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports_marketing" ADD CONSTRAINT "reports_marketing_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports_sale" ADD CONSTRAINT "reports_sale_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_config" ADD CONSTRAINT "kpi_config_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_contact_logs" ADD CONSTRAINT "wholesale_contact_logs_customer_id_wholesale_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."wholesale_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_customers" ADD CONSTRAINT "wholesale_customers_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;