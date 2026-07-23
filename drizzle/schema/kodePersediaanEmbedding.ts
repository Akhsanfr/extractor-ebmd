// pgvector belum punya type bawaan di drizzle-orm/pg-core, jadi bikin customType.

import { customType, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { embeddingStatusEnum } from "./enum";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { kodePersediaan } from "./kodePersediaan";

// bge-m3 (ollama) menghasilkan vector 1024 dimensi.
const vector = customType<{ data: number[]; driverData: string }>({
    dataType() {
        return "vector(1024)";
    },
    toDriver(value: number[]): string {
        return `[${value.join(",")}]`;
    },
    fromDriver(value: string): number[] {
        // pgvector mengembalikan string format "[0.1,0.2,...]"
        return value
            .slice(1, -1)
            .split(",")
            .map(Number);
    },
});

/**
 * STATUS PROSES EMBEDDING (dikelola background worker, bukan user).
 * - pending    : menunggu diproses worker
 * - processing : sedang diproses worker
 * - completed  : embedding valid & sinkron dengan content_hash
 * - failed     : gagal, menunggu retry
 */


/**
 * Tabel data AI — terpisah dari data bisnis proposal.
 * Dikelola sepenuhnya oleh background embedding worker (eventual consistency).
 * Ref: SHS-Proposal-Embedding-Architecture.md
 */
export const kodePersediaanEmbedding = pgTable("kode_persediaan_embedding", {
    kodePersediaanId: integer("kode_persediaan_id")
        .primaryKey()
        .references(() => kodePersediaan.id, { onDelete: "cascade" }),

    embedding: vector("embedding"),

    /**
     * Salinan content_hash pada saat embedding terakhir SUKSES dibuat.
     * Kalau != shsProposal.contentHash -> embedding dianggap stale.
     */
    embeddingHash: varchar("embedding_hash", { length: 64 }),

    /** Nama model embedding yang dipakai, mis. "bge-m3". */
    model: varchar("model", { length: 50 }),

    status: embeddingStatusEnum("status").notNull().default("pending"),

    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),

    retryCount: integer("retry_count").notNull().default(0),
    lastError: text("last_error"),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type SelectShsProposalEmbedding = InferSelectModel<typeof kodePersediaanEmbedding>;
export type InsertShsProposalEmbedding = InferInsertModel<typeof kodePersediaanEmbedding>;