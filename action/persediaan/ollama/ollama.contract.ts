import { z } from "zod";

export const OllamaContract = {
    input: z.object({
        kategori: z.string().optional(),
        nama108: z.string().optional(),
        namaBarang: z.string(),
        satuan: z.string(),
        keywords: z.string().optional(),
    }),

    result: z.array(z.number()),
};

// ─── Namespace Type ───────────────────────────────────────────────────────────

export namespace OllamaContract {
    export type InputDTO = z.infer<typeof OllamaContract.input>;
    export type ResultDTO = z.infer<typeof OllamaContract.result>;
}