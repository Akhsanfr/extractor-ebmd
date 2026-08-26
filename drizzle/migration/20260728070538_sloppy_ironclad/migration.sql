CREATE TYPE "public"."bmd_asset_type" AS ENUM('tanah', 'peralatan_dan_mesin', 'gedung_dan_bangunan', 'jalan_irigasi_dan_jaringan', 'aset_tetap_lain', 'kontruksi_dalam_pekerjaan', 'kemitraan_pihak_ketiga', 'aset_tak_berwujud', 'aset_lain_lain', 'persediaan_rusak_berat_usang', 'aset_bersejarah');--> statement-breakpoint
CREATE TYPE "public"."bmd_sub_sync_status" AS ENUM('pending', 'running', 'stopped', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."bmd_sync_status" AS ENUM('pending', 'running', 'paused', 'stopped', 'success', 'partial_success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('ebmd');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "sync_job" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_job_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"job_type" "job_type" NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"created_by" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"abort_by" text,
	"abortAt" timestamp with time zone,
	"abort_reason" text
);
--> statement-breakpoint
CREATE TABLE "sync_list" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_list_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"jobId" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"lastError" text,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"created_by" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"abort_by" text,
	"abortAt" timestamp with time zone,
	"abort_reason" text
);
--> statement-breakpoint
CREATE TABLE "sync_batch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_batch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"listId" integer NOT NULL,
	"batchSize" integer NOT NULL,
	"batchPage" integer NOT NULL,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"created_by" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"abort_by" text,
	"abortAt" timestamp with time zone,
	"abort_reason" text
);
--> statement-breakpoint
ALTER TABLE "bmd" ADD COLUMN "last_sync_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bmd" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_abort_by_user_id_fk" FOREIGN KEY ("abort_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_list" ADD CONSTRAINT "sync_list_jobId_sync_job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."sync_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_list" ADD CONSTRAINT "sync_list_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_list" ADD CONSTRAINT "sync_list_abort_by_user_id_fk" FOREIGN KEY ("abort_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_batch" ADD CONSTRAINT "sync_batch_listId_sync_list_id_fk" FOREIGN KEY ("listId") REFERENCES "public"."sync_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_batch" ADD CONSTRAINT "sync_batch_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_batch" ADD CONSTRAINT "sync_batch_abort_by_user_id_fk" FOREIGN KEY ("abort_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;