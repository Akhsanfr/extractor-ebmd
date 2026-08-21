"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, ProgressBar, Table } from "@heroui/react";
import { SyncStatusChip } from "@/component/SyncStatusChip";
import { cancelSyncJob } from "@/action/sync/syncJob/syncJob.action.update";
import type { SyncJobContract } from "@/action/sync/syncJob/syncJob.contract";
import { Eye } from "lucide-react";

export function SyncJobTable({ syncJobs }: { syncJobs: SyncJobContract.SelectWithProgressDTO[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleCancel(id: number) {
        const abortReason = window.prompt("Alasan pembatalan Sync Job:");
        if (!abortReason) return;

        startTransition(async () => {
            await cancelSyncJob({ id, abortReason });
            router.refresh();
        });
    }
    return (
        <Table aria-label="Daftar Sync Job">
            <Table.ScrollContainer>
                <Table.Content aria-label="Daftar Sync Job">
                    <Table.Header>
                        <Table.Column isRowHeader >Nama Job</Table.Column>
                        <Table.Column>Provider</Table.Column>
                        <Table.Column>Status</Table.Column>
                        <Table.Column>Progress Batch</Table.Column>
                        <Table.Column>Dibuat</Table.Column>
                        <Table.Column>Aksi</Table.Column>
                    </Table.Header>

                    <Table.Body
                        renderEmptyState={() => (
                            <EmptyState
                                title="Belum ada Sync Job"
                            // description="Buat Sync Job baru untuk memulai sinkronisasi."
                            />
                        )}
                    >
                        {syncJobs.map((job) => {
                            const progress =
                                job.totalBatch === 0
                                    ? 0
                                    : Math.round((job.completedBatch / job.totalBatch) * 100);

                            const canCancel =
                                job.status === "pending" || job.status === "processing";

                            return (
                                <Table.Row key={job.id}>
                                    <Table.Cell>
                                        <Link
                                            href={`/dashboard/sync/job/${job.id}`}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {job.name}
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell className="uppercase text-xs text-gray-500">
                                        {job.jobType}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <SyncStatusChip status={job.status} />
                                    </Table.Cell>
                                    <Table.Cell className="min-w-[180px]">
                                        <div className="flex flex-col gap-1">
                                            <ProgressBar value={progress} aria-label="Progress batch" />
                                            <span className="text-xs text-gray-500">
                                                {job.completedBatch}/{job.totalBatch} batch
                                                {job.failedBatch > 0 && ` · ${job.failedBatch} gagal`}
                                            </span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="text-xs text-gray-500">
                                        {new Date(job.createdAt).toLocaleString("id-ID")}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                isIconOnly
                                                onPress={() => router.push(`/dashboard/sync/${job.id}`)}
                                            >
                                                <Eye />
                                            </Button>
                                            {canCancel && (
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    isDisabled={isPending}
                                                    onPress={() => handleCancel(job.id)}
                                                >
                                                    Batalkan
                                                </Button>
                                            )}

                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    );
}
