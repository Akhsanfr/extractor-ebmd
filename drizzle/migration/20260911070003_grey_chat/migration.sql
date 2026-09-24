CREATE TYPE "alih_status_type" AS ENUM('Pengalihan Status Penggunaan', 'Penyerahan Kepada Pengelola');--> statement-breakpoint
CREATE TYPE "bmd_asset_type" AS ENUM('Tanah', 'Peralatan Dan Mesin', 'Gedung Dan Bangunan', 'Jalan Irigasi Dan Jaringan', 'Aset Tetap Lainnya', 'Konstruksi Dalam Pengerjaan', 'Kemitraan Pihak Ketiga', 'Aset Tak Berwujud', 'Aset Lain-Lain', 'Persediaan Rusak Berat/Usang', 'Aset Bersejarah');--> statement-breakpoint
CREATE TYPE "bmd_sub_sync_status" AS ENUM('pending', 'running', 'stopped', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "bmd_sync_status" AS ENUM('pending', 'running', 'paused', 'stopped', 'success', 'partial_success', 'failed');--> statement-breakpoint
CREATE TYPE "embedding_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "sebaran_bmd_status_bhumi" AS ENUM('sudahPlotting', 'belumPlotting', 'salahPlotting');--> statement-breakpoint
CREATE TYPE "job_type" AS ENUM('ebmd');--> statement-breakpoint
CREATE TYPE "sync_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'aborted');--> statement-breakpoint
CREATE TYPE "user_role_enum" AS ENUM('admin', 'admin-opd', 'user');--> statement-breakpoint
CREATE TABLE "alih_status_master" (
	"id" serial PRIMARY KEY,
	"nama" text,
	"alih_status_type" "alih_status_type",
	"perangkat_daerah_asal" text NOT NULL,
	"pengguna_barang_nama" text,
	"pengguna_barang_nip" text,
	"pengguna_barang_pangkat" text,
	"pengguna_barang_jabatan" text,
	"pengurus_barang_nama" text,
	"persetujuan_id" integer,
	"bast_id" integer,
	"penghapusan_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alih_status_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"asset_type" "bmd_asset_type",
	"kode_barang" text NOT NULL,
	"nibar" text,
	"kode_register" text,
	"nama_barang_kategori" text,
	"merk_tipe" text,
	"nomor_polisi" text,
	"nomor_rangka" text,
	"nomor_mesin" text,
	"kondisi" text,
	"lokasi" text,
	"asal_usul" text,
	"tahun" integer,
	"jumlah" numeric(20,2),
	"nilai_perolehan" numeric(20,2),
	"akumulasi_penyusutan" numeric(20,2),
	"nilai_buku" numeric(20,2),
	"perangkat_daerah_tujuan" text NOT NULL,
	"master_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_spkmb" (
	"id" serial PRIMARY KEY,
	"is_complete" boolean NOT NULL,
	"surat_tanggal" date,
	"surat_nomor" text NOT NULL,
	"scan_surat" text,
	"master_id" integer NOT NULL,
	"perangkat_daerah_tujuan" text NOT NULL,
	"pengguna_barang_nama" text NOT NULL,
	"pengguna_barang_nip" text NOT NULL,
	"pengguna_barang_pangkat" text NOT NULL,
	"pengguna_barang_jabatan" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_permohonan" (
	"id" serial PRIMARY KEY,
	"alasan" text,
	"surat_nomor" text,
	"surat_tanggal" date,
	"surat_hal" text,
	"master_id" integer NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_group_persetujuan" (
	"id" serial PRIMARY KEY,
	"nama" text NOT NULL,
	"alih_status_type" "alih_status_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_group_penghapusan" (
	"id" serial PRIMARY KEY,
	"nama" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_ba_penelitian" (
	"id" serial PRIMARY KEY,
	"master_id" integer NOT NULL,
	"surat_nomor" text,
	"surat_tanggal" date,
	"surat_hal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_nodin" (
	"id" serial PRIMARY KEY,
	"group_id" integer NOT NULL,
	"surat_nomor" text,
	"surat_tanggal" date,
	"surat_hal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_persetujuan_bupati" (
	"id" serial PRIMARY KEY,
	"group_id" integer NOT NULL,
	"surat_nomor" text,
	"surat_tanggal" date,
	"surat_hal" text,
	"alih_status_type" "alih_status_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_bast" (
	"id" serial PRIMARY KEY,
	"surat_nomor" text,
	"surat_tanggal" date,
	"perangkat_daerah_asal" text NOT NULL,
	"perangkat_daerah_tujuan" text NOT NULL,
	"pengguna_barang_asal_nama" text NOT NULL,
	"pengguna_barang_asal_nip" text NOT NULL,
	"pengguna_barang_asal_jabatan" text NOT NULL,
	"pengguna_barang_asal_pangkat" text NOT NULL,
	"pengguna_barang_tujuan_nama" text NOT NULL,
	"pengguna_barang_tujuan_nip" text NOT NULL,
	"pengguna_barang_tujuan_jabatan" text NOT NULL,
	"pengguna_barang_tujuan_pangkat" text NOT NULL,
	"permohoan_penghapusan_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_permohonan_penghapusan" (
	"id" serial PRIMARY KEY,
	"surat_nomor" text,
	"surat_tanggal" date,
	"surat_hal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "alih_status_sk_hapus" (
	"id" serial PRIMARY KEY,
	"group_id" integer NOT NULL,
	"surat_nomor" text,
	"surat_tanggal" date,
	"surat_hal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "perangkat_daerah" (
	"kode_lokasi" varchar(30) PRIMARY KEY,
	"nama_lokasi" text NOT NULL,
	"jabatan" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "sebaran_bmd" (
	"nibar" varchar(50) PRIMARY KEY,
	"nibel" varchar(50),
	"polygon" geometry(MultiPolygon,4326),
	"hak" text,
	"nomor" text,
	"desa" text,
	"updated_by" text,
	"pic" text,
	"updated_at" timestamp with time zone,
	"status_plotting" boolean,
	"status_bhumi" "sebaran_bmd_status_bhumi",
	"keterangan" text
);
--> statement-breakpoint
CREATE TABLE "rkbmd_ba" (
	"perangkat_daerah_id" varchar(30) PRIMARY KEY,
	"pengantar" boolean DEFAULT false NOT NULL,
	"pengadaan" boolean DEFAULT false NOT NULL,
	"pemeliharaan" boolean DEFAULT false NOT NULL,
	"pengantar_tanggal" timestamp,
	"pengantar_nomor" text,
	"nomor_surat" text,
	"nama_peserta" text,
	"nip_peserta" varchar(30),
	"jabatan_peserta" text,
	"tanggal_perbaikan" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bmd" (
	"nibar" text PRIMARY KEY,
	"nomor_register" text NOT NULL,
	"kode_barang" text NOT NULL,
	"nama_barang" text NOT NULL,
	"spesifikasi_nama_barang" text NOT NULL,
	"spesifikasi_lainnya" text,
	"jumlah" numeric(18,2) NOT NULL,
	"satuan" text,
	"lokasi" text NOT NULL,
	"perangkat_daerah_id" varchar(30),
	"last_sync_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"issuer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" serial PRIMARY KEY,
	"user_id" text UNIQUE,
	"nama" text NOT NULL,
	"nip" varchar(20) UNIQUE,
	"wa" varchar(15),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"role" "user_role_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kode_persediaan" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kode_persediaan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kode_108" varchar(30) NOT NULL,
	"kategori" text,
	"nama_108" varchar(255) NOT NULL,
	"kode_nusp" varchar(40) NOT NULL UNIQUE,
	"nama_barang" varchar(255) NOT NULL,
	"satuan" varchar(100) NOT NULL,
	"keywords" varchar(1000),
	"content_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kode_persediaan_embedding" (
	"kode_persediaan_id" integer PRIMARY KEY,
	"embedding" vector(1024),
	"embedding_hash" varchar(64),
	"model" varchar(50),
	"status_embedding" "embedding_status" DEFAULT 'pending'::"embedding_status" NOT NULL,
	"is_search_ready" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_job" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_job_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"job_type" "job_type" NOT NULL,
	"status" "sync_status" DEFAULT 'pending'::"sync_status" NOT NULL,
	"totalList" integer DEFAULT 0 NOT NULL,
	"completedList" integer DEFAULT 0 NOT NULL,
	"failedList" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"abort_by" text,
	"abortAt" timestamp with time zone,
	"abortReason" text
);
--> statement-breakpoint
CREATE TABLE "sync_list" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_list_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"jobId" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"resource" jsonb,
	"status" "sync_status" DEFAULT 'pending'::"sync_status" NOT NULL,
	"totalBatch" integer DEFAULT 0 NOT NULL,
	"completedBatch" integer DEFAULT 0 NOT NULL,
	"failedBatch" integer DEFAULT 0 NOT NULL,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"created_by" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"abort_by" text,
	"abortAt" timestamp with time zone,
	"abortReason" text
);
--> statement-breakpoint
CREATE TABLE "sync_batch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_batch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"listId" integer NOT NULL,
	"batchPage" integer NOT NULL,
	"batchSize" integer NOT NULL,
	"status" "sync_status" DEFAULT 'pending'::"sync_status" NOT NULL,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"created_by" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"abort_by" text,
	"abortAt" timestamp with time zone,
	"abortReason" text
);
--> statement-breakpoint
CREATE INDEX "alih_status_master_perangkat_daerah_asal_idx" ON "alih_status_master" ("perangkat_daerah_asal");--> statement-breakpoint
CREATE INDEX "alih_status_data_kode_barang_idx" ON "alih_status_data" ("kode_barang");--> statement-breakpoint
CREATE INDEX "alih_status_data_kode_register_idx" ON "alih_status_data" ("kode_register");--> statement-breakpoint
CREATE INDEX "alih_status_data_master_idx" ON "alih_status_data" ("master_id");--> statement-breakpoint
CREATE INDEX "alih_status_spkmb_master_idx" ON "alih_status_spkmb" ("master_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alih_status_spkmb_perangkat_daerah_tujuan_master_id_index" ON "alih_status_spkmb" ("perangkat_daerah_tujuan","master_id");--> statement-breakpoint
CREATE INDEX "alih_status_permohonan_surat_nomor_idx" ON "alih_status_permohonan" ("surat_nomor");--> statement-breakpoint
CREATE INDEX "alih_status_ba_penelitian_permohonan_idx" ON "alih_status_ba_penelitian" ("master_id");--> statement-breakpoint
CREATE INDEX "alih_status_nodin_group_idx" ON "alih_status_nodin" ("group_id");--> statement-breakpoint
CREATE INDEX "alih_status_persetujuan_bupati_group_idx" ON "alih_status_persetujuan_bupati" ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alih_status_bast_perangkat_daerah_asal_perangkat_daerah_tujuan_index" ON "alih_status_bast" ("perangkat_daerah_asal","perangkat_daerah_tujuan");--> statement-breakpoint
CREATE INDEX "alih_status_sk_hapus_group_id_index" ON "alih_status_sk_hapus" ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_user_id_role_idx" ON "user_role" ("user_id","role");--> statement-breakpoint
ALTER TABLE "alih_status_master" ADD CONSTRAINT "alih_status_master_Vi7Amn1swUuU_fkey" FOREIGN KEY ("persetujuan_id") REFERENCES "alih_status_group_persetujuan"("id");--> statement-breakpoint
ALTER TABLE "alih_status_master" ADD CONSTRAINT "alih_status_master_bast_id_alih_status_bast_id_fkey" FOREIGN KEY ("bast_id") REFERENCES "alih_status_bast"("id");--> statement-breakpoint
ALTER TABLE "alih_status_master" ADD CONSTRAINT "alih_status_master_nWqG14mmGsG8_fkey" FOREIGN KEY ("penghapusan_id") REFERENCES "alih_status_group_penghapusan"("id");--> statement-breakpoint
ALTER TABLE "alih_status_master" ADD CONSTRAINT "alih_status_master_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_master" ADD CONSTRAINT "alih_status_master_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_master" ADD CONSTRAINT "alih_status_master_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_data" ADD CONSTRAINT "alih_status_data_master_id_alih_status_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "alih_status_master"("id");--> statement-breakpoint
ALTER TABLE "alih_status_data" ADD CONSTRAINT "alih_status_data_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_data" ADD CONSTRAINT "alih_status_data_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_spkmb" ADD CONSTRAINT "alih_status_spkmb_master_id_alih_status_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "alih_status_master"("id");--> statement-breakpoint
ALTER TABLE "alih_status_spkmb" ADD CONSTRAINT "alih_status_spkmb_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_spkmb" ADD CONSTRAINT "alih_status_spkmb_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_spkmb" ADD CONSTRAINT "alih_status_spkmb_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan" ADD CONSTRAINT "alih_status_permohonan_master_id_alih_status_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "alih_status_master"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan" ADD CONSTRAINT "alih_status_permohonan_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan" ADD CONSTRAINT "alih_status_permohonan_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan" ADD CONSTRAINT "alih_status_permohonan_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_group_persetujuan" ADD CONSTRAINT "alih_status_group_persetujuan_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_group_persetujuan" ADD CONSTRAINT "alih_status_group_persetujuan_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_group_persetujuan" ADD CONSTRAINT "alih_status_group_persetujuan_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_group_penghapusan" ADD CONSTRAINT "alih_status_group_penghapusan_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_group_penghapusan" ADD CONSTRAINT "alih_status_group_penghapusan_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_group_penghapusan" ADD CONSTRAINT "alih_status_group_penghapusan_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_ba_penelitian" ADD CONSTRAINT "alih_status_ba_penelitian_master_id_alih_status_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "alih_status_master"("id");--> statement-breakpoint
ALTER TABLE "alih_status_ba_penelitian" ADD CONSTRAINT "alih_status_ba_penelitian_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_ba_penelitian" ADD CONSTRAINT "alih_status_ba_penelitian_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_ba_penelitian" ADD CONSTRAINT "alih_status_ba_penelitian_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_nodin" ADD CONSTRAINT "alih_status_nodin_a7lxzCnj9lfB_fkey" FOREIGN KEY ("group_id") REFERENCES "alih_status_group_persetujuan"("id");--> statement-breakpoint
ALTER TABLE "alih_status_nodin" ADD CONSTRAINT "alih_status_nodin_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_nodin" ADD CONSTRAINT "alih_status_nodin_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_nodin" ADD CONSTRAINT "alih_status_nodin_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_persetujuan_bupati" ADD CONSTRAINT "alih_status_persetujuan_bupati_4wfXBAdxSDed_fkey" FOREIGN KEY ("group_id") REFERENCES "alih_status_group_persetujuan"("id");--> statement-breakpoint
ALTER TABLE "alih_status_persetujuan_bupati" ADD CONSTRAINT "alih_status_persetujuan_bupati_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_persetujuan_bupati" ADD CONSTRAINT "alih_status_persetujuan_bupati_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_persetujuan_bupati" ADD CONSTRAINT "alih_status_persetujuan_bupati_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_bast" ADD CONSTRAINT "alih_status_bast_eETFan8plZPS_fkey" FOREIGN KEY ("permohoan_penghapusan_id") REFERENCES "alih_status_permohonan_penghapusan"("id");--> statement-breakpoint
ALTER TABLE "alih_status_bast" ADD CONSTRAINT "alih_status_bast_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_bast" ADD CONSTRAINT "alih_status_bast_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan_penghapusan" ADD CONSTRAINT "alih_status_permohonan_penghapusan_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan_penghapusan" ADD CONSTRAINT "alih_status_permohonan_penghapusan_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_permohonan_penghapusan" ADD CONSTRAINT "alih_status_permohonan_penghapusan_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_sk_hapus" ADD CONSTRAINT "alih_status_sk_hapus_jZEm2rYCzPJL_fkey" FOREIGN KEY ("group_id") REFERENCES "alih_status_group_penghapusan"("id");--> statement-breakpoint
ALTER TABLE "alih_status_sk_hapus" ADD CONSTRAINT "alih_status_sk_hapus_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_sk_hapus" ADD CONSTRAINT "alih_status_sk_hapus_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "alih_status_sk_hapus" ADD CONSTRAINT "alih_status_sk_hapus_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "rkbmd_ba" ADD CONSTRAINT "rkbmd_ba_perangkat_daerah_id_perangkat_daerah_kode_lokasi_fkey" FOREIGN KEY ("perangkat_daerah_id") REFERENCES "perangkat_daerah"("kode_lokasi") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bmd" ADD CONSTRAINT "bmd_perangkat_daerah_id_perangkat_daerah_kode_lokasi_fkey" FOREIGN KEY ("perangkat_daerah_id") REFERENCES "perangkat_daerah"("kode_lokasi") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kode_persediaan_embedding" ADD CONSTRAINT "kode_persediaan_embedding_9xO8T3TfmyMc_fkey" FOREIGN KEY ("kode_persediaan_id") REFERENCES "kode_persediaan"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_abort_by_user_id_fkey" FOREIGN KEY ("abort_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sync_list" ADD CONSTRAINT "sync_list_jobId_sync_job_id_fkey" FOREIGN KEY ("jobId") REFERENCES "sync_job"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sync_list" ADD CONSTRAINT "sync_list_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sync_list" ADD CONSTRAINT "sync_list_abort_by_user_id_fkey" FOREIGN KEY ("abort_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sync_batch" ADD CONSTRAINT "sync_batch_listId_sync_list_id_fkey" FOREIGN KEY ("listId") REFERENCES "sync_list"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sync_batch" ADD CONSTRAINT "sync_batch_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sync_batch" ADD CONSTRAINT "sync_batch_abort_by_user_id_fkey" FOREIGN KEY ("abort_by") REFERENCES "user"("id");