CREATE TABLE "bmd" (
	"nibar" text PRIMARY KEY NOT NULL,
	"nomor_register" text NOT NULL,
	"kode_barang" text NOT NULL,
	"nama_barang" text NOT NULL,
	"spesifikasi_nama_barang" text NOT NULL,
	"spesifikasi_lainnya" text,
	"jumlah" numeric(18, 2) NOT NULL,
	"satuan" text,
	"lokasi" text NOT NULL,
	"perangkat_daerah_id" varchar(30)
);
--> statement-breakpoint
ALTER TABLE "bmd" ADD CONSTRAINT "bmd_perangkat_daerah_id_perangkat_daerah_kode_lokasi_fk" FOREIGN KEY ("perangkat_daerah_id") REFERENCES "public"."perangkat_daerah"("kode_lokasi") ON DELETE cascade ON UPDATE no action;