export const BmdSyncStatus = {
    PENDING: "pending",
    RUNNING: "running",
    PAUSED: "paused",
    STOPPED: "stopped",
    SUCCESS: "success",
    PARTIAL_SUCCESS: "partial_success",
    FAILED: "failed",
} as const;

export type BmdSyncStatus =
    typeof BmdSyncStatus[keyof typeof BmdSyncStatus];

export const BmdSubSyncStatus = {
    PENDING: "pending",
    RUNNING: "running",
    STOPPED: "stopped",
    SUCCESS: "success",
    FAILED: "failed",
} as const;

export type BmdSubSyncStatus =
    typeof BmdSubSyncStatus[keyof typeof BmdSubSyncStatus];