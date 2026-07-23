import { z } from "zod";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const SuratPesananItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unit_price: z.number(),
  total_price: z.number(),
});

export const SuratPesananExtractResultSchema = z.object({
  filename: z.string().optional(),
  document_type: z.string().optional(),
  confidence: z.number().optional(),
  transaction_date: z.string().optional(),
  items: z.array(SuratPesananItemSchema),
});

export type SuratPesananItem = z.infer<typeof SuratPesananItemSchema>;
export type SuratPesananExtractResult = z.infer<
  typeof SuratPesananExtractResultSchema
>;

export const SuratPesananContract = {
  extract: {
    input: z.object({
      file: z
        .instanceof(File)
        .refine((file) => file.type === "application/pdf", {
          message: "File harus berformat PDF",
        })
        .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, {
          message: "Ukuran file maksimal 10MB",
        }),
    }),
    output: SuratPesananExtractResultSchema,
  },
};
