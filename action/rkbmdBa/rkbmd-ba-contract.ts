import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { rkbmdBaTable } from "@/drizzle/schema";

const selectSchema = createSelectSchema(rkbmdBaTable).extend({ perangkatDaerah: z.string() });

const insertSchema = createInsertSchema(rkbmdBaTable, {
  namaPeserta: (s) => s.min(1, "Nama peserta wajib diisi"),
  nipPeserta: (s) => s.min(1, "NIP peserta wajib diisi"),
});

export const RkbmdBaContract = {
  select: selectSchema,

  update: insertSchema
    .partial()
    .required({ perangkatDaerahId: true }),

  insert: insertSchema,
};

export namespace RkbmdBaContract {
  export type SelectDTO = z.infer<typeof RkbmdBaContract.select>;
  export type UpdateDTO = z.infer<typeof RkbmdBaContract.update>;
  export type InsertDTO = z.infer<typeof RkbmdBaContract.insert>;
}
