import { z } from "zod";
import { OllamaContract } from "../ollama/ollama.contract";
import { createSelectSchema } from "drizzle-zod";
import { kodePersediaan } from "@/drizzle/schema";

export const KodePersediaanInputSchema = z.object({
  items: z
    .array(
      z.object({
        description: z.string().min(1),
      })
    )
    .min(1),
});

export const KodePersediaanCandidateSchema = z.object({
  id: z.number(),
  kode108: z.string(),
  nama108: z.string(),
  kodeNusp: z.string(),
  namaBarang: z.string(),
  satuan: z.string(),
  /** 0..1, semakin besar semakin mirip */
  similarity: z.number(),
});

export const KodePersediaanResultSchema = z.object({
  description: z.string(),
  candidates: z.array(KodePersediaanCandidateSchema),
});

export const KodePersediaanContract = {
  input: KodePersediaanInputSchema,
  select: createSelectSchema(kodePersediaan).pick({
    id: true,
    kategori: true,
    nama108: true,
    kode108: true,
    namaBarang: true,
    satuan: true
  })
  // result: z.array(KodePersediaanResultSchema),
};

// ─── Namespace Type ───────────────────────────────────────────────────────────

export namespace KodePersediaanContract {
  export type InputDTO = z.infer<typeof KodePersediaanContract.input>;
  export type CandidateDTO = z.infer<typeof KodePersediaanCandidateSchema>;
  export type ResultDTO = z.infer<typeof KodePersediaanContract.select>;
}