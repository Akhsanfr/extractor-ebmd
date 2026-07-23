import { z } from "zod";
import { OllamaContract } from "../ollama/ollama.contract";
import { KodePersediaanContract } from "../kodePersediaan/kodePersediaan.contract";

const KodePersediaanMatchSchema = KodePersediaanContract.select.extend({
    similarity: z.number(),
});

export const FindMatchKodePersediaanContract = {
    input: z.array(OllamaContract.input.extend({
        price: z.number(),
        unit: z.string(),
    })),

    candidate: z.array(KodePersediaanMatchSchema),

    output: z.array(z.object({
        description: z.string(),
        unit: z.string(),
        price: z.number(),
        candidates: z.array(KodePersediaanMatchSchema),
    })),
};

// ─── Namespace Type ───────────────────────────────────────────────────────────

export namespace FindMatchKodePersediaanContract {
    export type InputDTO = z.infer<typeof FindMatchKodePersediaanContract.input>;
    export type CandidateDTO = z.infer<typeof FindMatchKodePersediaanContract.candidate>;
    export type OutputDTO = z.infer<typeof FindMatchKodePersediaanContract.output>;
}