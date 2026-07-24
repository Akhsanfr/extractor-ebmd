CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "kode_persediaan" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kode_persediaan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kode_108" varchar(30) NOT NULL,
	"nama_108" varchar(255) NOT NULL,
	"kode_nusp" varchar(40) NOT NULL,
	"nama_barang" varchar(255) NOT NULL,
	"satuan" varchar(100) NOT NULL,
	"keywords" varchar(1000),
	"content_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "kode_persediaan_kode_nusp_unique" UNIQUE("kode_nusp")
);
--> statement-breakpoint
CREATE TABLE "kode_persediaan_embedding" (
	"kode_persediaan_id" integer PRIMARY KEY NOT NULL,
	"embedding" vector(1024),
	"embedding_hash" varchar(64),
	"model" varchar(50),
	"status" "embedding_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kode_persediaan_embedding" ADD CONSTRAINT "kode_persediaan_embedding_kode_persediaan_id_kode_persediaan_id_fk" FOREIGN KEY ("kode_persediaan_id") REFERENCES "public"."kode_persediaan"("id") ON DELETE cascade ON UPDATE no action;