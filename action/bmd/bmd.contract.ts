import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { bmdTable } from "@/drizzle/schema/bmd";

// Final Contract
export const BmdContract = {
  select: createSelectSchema(bmdTable),
  create: createInsertSchema(bmdTable),
  update: createInsertSchema(bmdTable).omit({
    nibar: true,
  }),
  insert: createInsertSchema(bmdTable),
  upsert: createInsertSchema(bmdTable),
};

// Namespace Type
export namespace BmdContract {
  export type SelectDTO = z.infer<typeof BmdContract.select>;
  export type CreateDTO = z.infer<typeof BmdContract.create>;
  export type UpdateDTO = z.infer<typeof BmdContract.update>;
  export type InsertDTO = z.infer<typeof BmdContract.insert>;
  export type UpsertDTO = z.infer<typeof BmdContract.upsert>;
}