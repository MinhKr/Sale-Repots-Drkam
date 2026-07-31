ALTER TABLE "employees" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_auth_user_id_unique" UNIQUE("auth_user_id");