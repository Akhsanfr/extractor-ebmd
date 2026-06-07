CREATE TABLE "rkbmd_ba" (
	"perangkat_daerah_id" varchar(30) PRIMARY KEY NOT NULL,
	"pengantar" boolean DEFAULT false NOT NULL,
	"pengadaan" boolean DEFAULT false NOT NULL,
	"pemeliharaan" boolean DEFAULT false NOT NULL,
	"nama_peserta" text,
	"nip_peserta" varchar(30),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "rkbmd_ba" ADD CONSTRAINT "rkbmd_ba_perangkat_daerah_id_perangkat_daerah_kode_lokasi_fk" FOREIGN KEY ("perangkat_daerah_id") REFERENCES "public"."perangkat_daerah"("kode_lokasi") ON DELETE cascade ON UPDATE no action;