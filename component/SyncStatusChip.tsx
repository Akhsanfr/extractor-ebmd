import { SyncStatus } from "@/enum/sync";
import { Chip, type ChipProps } from "@heroui/react";

const statusColor: Record<SyncStatus, ChipProps["color"]> = {
    pending: "default",
    processing: "accent",
    completed: "success",
    failed: "danger",
    aborted: "warning",
};

const statusLabel: Record<SyncStatus, string> = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    aborted: "Cancelled",
};

interface SyncStatusChipProps {
    status: SyncStatus;
    variant?: ChipProps["variant"];
}

export function SyncStatusChip({
    status,
    variant,
}: SyncStatusChipProps) {
    return (
        <Chip
            size="sm"
            color={statusColor[status]}
            variant={variant}
        >
            {statusLabel[status]}
        </Chip>
    );
}