import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { bmd } from "@/drizzle/schema/bmd";

// Base Schema
const selectSchema = createSelectSchema(bmd);

// Insert Schema
const insertSchema = createInsertSchema(bmd, {
  nibar: (s) => s.min(1, "NIBAR wajib diisi"),
  nomorRegister: (s) => s.min(1, "Nomor register wajib diisi"),
  kodeBarang: (s) => s.min(1, "Kode barang wajib diisi"),
  namaBarang: (s) => s.min(1, "Nama barang wajib diisi"),
  jumlah: z.string().or(z.number()).transform(String),
});

// Final Contract
export const BmdContract = {
  select: selectSchema,
  create: insertSchema.omit({}),
  update: insertSchema.partial().required({
    nibar: true,
  }),
  insert: insertSchema,
  upsert: insertSchema,

  // TAMBAHAN: Validasi untuk bulk upsert (Array of Insert Schema)
  bulkUpsert: z.array(insertSchema),
};

// Namespace Type
export namespace BmdContract {
  export type SelectDTO = z.infer<typeof BmdContract.select>;
  export type CreateDTO = z.infer<typeof BmdContract.create>;
  export type UpdateDTO = z.infer<typeof BmdContract.update>;
  export type InsertDTO = z.infer<typeof BmdContract.insert>;
  export type UpsertDTO = z.infer<typeof BmdContract.upsert>;

  // TAMBAHAN: DTO untuk bulk upsert
  export type BulkUpsertDTO = z.infer<typeof BmdContract.bulkUpsert>;
}