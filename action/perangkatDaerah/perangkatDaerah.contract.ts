import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { perangkatDaerahTable } from "@/drizzle/schema/perangkatDaerah";
import { PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";


const insertSchema = createInsertSchema(perangkatDaerahTable, {
  kodeLokasi: (s) => s.min(1, "Kode lokasi wajib diisi").max(30),
  namaLokasi: (s) => s.min(1, "Nama lokasi wajib diisi"),
  jabatan: (s) => s.min(1, "Jabatan wajib diisi"),
});

// ─── Final Contract ───────────────────────────────────────────────────────────

export const PerangkatDaerahContract = {
  select: createSelectSchema(perangkatDaerahTable),
  lokasi: z.string(),

  create: insertSchema.omit({
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
  }),

  insert: insertSchema,

};

// ─── Namespace Type ───────────────────────────────────────────────────────────

export namespace PerangkatDaerahContract {
  export type SelectDTO = z.infer<typeof PerangkatDaerahContract.select>;
  export type CreateDTO = z.infer<typeof PerangkatDaerahContract.create>;
  export type InsertDTO = z.infer<typeof PerangkatDaerahContract.insert>;
  export type LokasiDTO = z.infer<typeof PerangkatDaerahContract.lokasi>
}