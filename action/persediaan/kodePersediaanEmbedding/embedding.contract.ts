// app/action/embedding/embedding.contract.ts
import { kodePersediaanEmbedding } from "@/drizzle/schema/kodePersediaanEmbedding";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─────────────────────────────────────────────
// STATUS ENUM (samakan dengan embeddingStatusEnum di schema)
// ─────────────────────────────────────────────
const embeddingStatusValues = [
    "pending",
    "processing",
    "completed",
    "failed",
] as const;

export const embeddingStatusSchema = z.enum(embeddingStatusValues);

// Vector bge-m3 = 1024 dimensi
const EMBEDDING_DIM = 1024;
const embeddingVectorSchema = z
    .array(z.number())
    .length(EMBEDDING_DIM, `Embedding harus berdimensi ${EMBEDDING_DIM}`);

// ─────────────────────────────────────────────
// DB BASE — full row dari tabel shs_proposal_embedding
// ─────────────────────────────────────────────
const dbBase = createSelectSchema(kodePersediaanEmbedding, {
    kodePersediaanId: z.number().int().positive(),
    embedding: embeddingVectorSchema.nullable(),
    embeddingHash: z.string().length(64).nullable(),
    model: z.string().max(50).nullable(),
    statusEmbedding: embeddingStatusSchema,
    retryCount: z.number().int().min(0),
    lastError: z.string().nullable(),
});

// ─────────────────────────────────────────────
// SELECT — dipakai kalau butuh full row (mis. admin/debug)
// ─────────────────────────────────────────────
const selectSchema = dbBase;

/**
 * SELECT STATUS — subset ringan untuk polling/SSE ke client.
 * Sengaja tidak menyertakan vector `embedding` (besar, tidak perlu di FE).
 */
const selectStatusSchema = dbBase.pick({
    kodePersediaanId: true,
    statusEmbedding: true,
    retryCount: true,
    lastError: true,
    completedAt: true,
    updatedAt: true,
});

/**
 * SELECT FOR SIMILARITY — dipakai proposal.repository.getProposalEmbeddingById.
 * embedding wajib ada (dicek null di service sebelum dipakai query similarity).
 */
const selectForSimilaritySchema = dbBase.pick({
    kodePersediaanId: true,
    embedding: true,
    statusEmbedding: true,
});

// ─────────────────────────────────────────────
// INSERT PENDING — dipanggil saat createProposal
// Hanya proposalId; status/retryCount/dll pakai default kolom.
// ─────────────────────────────────────────────
const insertPendingSchema = dbBase.pick({
    kodePersediaanId: true,
});

// ─────────────────────────────────────────────
// WORKER: CLAIM JOB — hasil query claimEmbeddingBatch
// (join ke shsProposal, bukan murni kolom shsProposalEmbedding)
// ─────────────────────────────────────────────
const claimJobSchema = z.object({
    proposalId: z.number().int().positive(),
    name: z.string(),
    specification: z.string(),
    price: z.number(),
    contentHash: z.string().length(64).nullable(),
    retryCount: z.number().int().min(0),
});

// ─────────────────────────────────────────────
// WORKER: MARK COMPLETED
// ─────────────────────────────────────────────
const markCompletedSchema = z.object({
    proposalId: z.number().int().positive(),
    embedding: embeddingVectorSchema,
    embeddingHash: z.string().length(64),
    model: z.string().max(50),
});

// ─────────────────────────────────────────────
// WORKER: MARK FAILED
// ─────────────────────────────────────────────
const markFailedSchema = z.object({
    proposalId: z.number().int().positive(),
    lastError: z.string().max(2000), // batasi biar tidak membengkak di DB
});

// ─────────────────────────────────────────────
// FINAL CONTRACT
// ─────────────────────────────────────────────
export const EmbeddingContract = {
    select: selectSchema,
    selectStatus: selectStatusSchema,
    selectForSimilarity: selectForSimilaritySchema,
    insertPending: insertPendingSchema,
    claimJob: claimJobSchema,
    markCompleted: markCompletedSchema,
    markFailed: markFailedSchema,
    status: embeddingStatusSchema,
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export namespace EmbeddingContract {
    export type SelectDTO = z.infer<typeof selectSchema>;
    export type SelectStatusDTO = z.infer<typeof selectStatusSchema>;
    export type SelectForSimilarityDTO = z.infer<typeof selectForSimilaritySchema>;
    export type InsertPendingDTO = z.infer<typeof insertPendingSchema>;
    export type ClaimJobDTO = z.infer<typeof claimJobSchema>;
    export type MarkCompletedDTO = z.infer<typeof markCompletedSchema>;
    export type MarkFailedDTO = z.infer<typeof markFailedSchema>;
    export type Status = z.infer<typeof embeddingStatusSchema>;
}