export const SyncStatus = {
    Pending: "pending",
    Processing: "processing",
    Completed: "completed",
    Failed: "failed",
    Aborted: "aborted",
} as const;

export type SyncStatus =
    typeof SyncStatus[keyof typeof SyncStatus];


export const SyncJobType = {
    EBMD: "ebmd",
} as const;

export type SyncJobType = typeof SyncJobType[keyof typeof SyncJobType];