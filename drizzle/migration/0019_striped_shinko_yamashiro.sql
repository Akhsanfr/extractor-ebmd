ALTER TABLE "sync_job" RENAME COLUMN "abort_reason" TO "abortReason";--> statement-breakpoint
ALTER TABLE "sync_list" RENAME COLUMN "abort_reason" TO "abortReason";--> statement-breakpoint
ALTER TABLE "sync_batch" RENAME COLUMN "abort_reason" TO "abortReason";--> statement-breakpoint
ALTER TYPE sync_status RENAME VALUE 'cancelled' TO 'aborted';
ALTER TABLE "sync_job" ADD COLUMN "totalList" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_job" ADD COLUMN "completedList" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_job" ADD COLUMN "failedList" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_list" ADD COLUMN "resource" jsonb;--> statement-breakpoint
ALTER TABLE "sync_list" ADD COLUMN "totalBatch" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_list" ADD COLUMN "completedBatch" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_list" ADD COLUMN "failedBatch" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_list" ADD COLUMN "retryCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_batch" ADD COLUMN "lastError" text;