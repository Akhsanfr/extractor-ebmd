CREATE TABLE "lokasi" (
	"id" serial PRIMARY KEY NOT NULL,
	"kode_lokasi" text NOT NULL,
	"nama_lokasi" text NOT NULL,
	"jabatan" text NOT NULL,
	CONSTRAINT "lokasi_kode_lokasi_unique" UNIQUE("kode_lokasi")
);
--> statement-breakpoint
CREATE TABLE "sebaran_bmd" (
	"nibar" varchar(50) PRIMARY KEY NOT NULL,
	"polygon" geometry(MultiPolygon,4326),
	"hak" text,
	"nomor" text,
	"desa" text,
	"updated_by" text,
	"pic" text,
	"updated_at" timestamp with time zone
);
