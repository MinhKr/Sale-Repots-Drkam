CREATE TYPE "public"."employment" AS ENUM('FT', 'PT');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('MB', 'MN');--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "region" "region";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment" "employment";