
export const EmbeddingStatus = {
    Pending: "pending",
    Processing: "processing",
    Completed: "completed",
    Failed: "failed",
} as const;

export type EmbeddingStatus =
    typeof EmbeddingStatus[keyof typeof EmbeddingStatus];