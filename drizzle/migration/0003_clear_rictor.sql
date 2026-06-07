CREATE TABLE "perangkat_daerah" (
	"kode_lokasi" varchar(30) PRIMARY KEY NOT NULL,
	"nama_lokasi" text NOT NULL,
	"jabatan" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "lokasi" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "lokasi" CASCADE;--> statement-breakpoint
ALTER TABLE "sebaran_bmd" ALTER COLUMN "status_plotting" DROP DEFAULT;