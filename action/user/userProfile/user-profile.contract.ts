import { userProfileTable, userTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { UserContract } from "../user/user.contract";
const nip = z
  .string()
  .trim()
  .length(18, "NIP harus terdiri dari 16 digit")
  .regex(/^\d+$/, "NIP hanya boleh berisi angka")

const wa = z
  .string()
  .trim()
  .min(9, "No. WhatsApp minimal 9 Karakter")
  .max(13, "No. WhatsApp maksimal 13 karakter")
  .regex(/^[0-9+]*$/, "No. WhatsApp hanya boleh berisi angka")

const createSchema = createInsertSchema(userProfileTable).extend({
  nama: z.string().trim().min(1, "Nama wajib diisi").max(255),
  nip,
  wa,
})

export const UserProfileContract = {
  create: createSchema.omit({ createdAt: true, createdBy: true, deletedAt: true, updatedBy: true }),
  insert: createSchema,

  edit: createInsertSchema(userProfileTable).extend({
    id: z.number().int().positive(),
    nama: z.string().trim().min(1, "Nama wajib diisi").max(255),
    nip,
    wa,
  }),

  delete: z.object({
    id: z.coerce.number().int().positive(),
  }),

  select: createSelectSchema(userProfileTable),
} as const;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace UserProfileContract {
  export type CreateDTO = z.infer<typeof UserProfileContract.create>;
  export type InsertDTO = z.infer<typeof UserProfileContract.insert>
  export type EditDTO = z.infer<typeof UserProfileContract.edit>;
  export type DeleteDTO = z.infer<typeof UserProfileContract.delete>;
  export type SelectDTO = z.infer<typeof UserProfileContract.select>;
  export type SelectWithUserDTO = z.infer<typeof UserProfileContract.select>;
}
