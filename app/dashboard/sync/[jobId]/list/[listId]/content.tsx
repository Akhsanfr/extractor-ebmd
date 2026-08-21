"use client";

import { getSyncBatchesByListId } from "@/action/sync/syncBatch/syncBatch.action.read";
import { SyncStatusChip } from "@/component/SyncStatusChip";
import { Button, EmptyState, Table, toast } from "@heroui/react";
import { SyncBatchContract } from "@/action/sync/syncBatch/syncBatch.contract";
import { useEffect, useState } from "react";

export default function Content({ jobId, listId }: { jobId: number, listId: number }) {
    const [syncBatch, setSyncBatch] = useState<SyncBatchContract.SelectDTO[]>([]);

    const getSyncBatch = async () => {
        try {
            const result = await getSyncBatchesByListId(listId);
            if (!result.success) {
                throw result.error
            }
            setSyncBatch(result.data)
        } catch (error: any) {
            toast.danger("Gagal memuat data sync Batch")
        }
    }

    useEffect(() => { getSyncBatch() }, [])

    return (
        <Table aria-label="Daftar Sync Batch">
            <Table.ScrollContainer>
                <Table.Content aria-label="Daftar Sync Batch">
                    <Table.Header>
                        <Table.Column isRowHeader>Batch</Table.Column>
                        <Table.Column>Ukuran</Table.Column>
                        <Table.Column>Status</Table.Column>
                        <Table.Column>Retry</Table.Column>
                        <Table.Column>Selesai</Table.Column>
                        <Table.Column>Aksi</Table.Column>
                    </Table.Header>

                    <Table.Body
                        renderEmptyState={() => (
                            <EmptyState
                                title="Belum ada Sync Batch"
                            // description="Batch akan muncul setelah List diproses."
                            />
                        )}
                    >
                        {syncBatch.map((batch) => {
                            const canDelete =
                                batch.status !== "pending" && batch.status !== "processing";

                            return (
                                <Table.Row key={batch.id}>
                                    <Table.Cell className="font-medium">
                                        Batch #{batch.batchPage}
                                    </Table.Cell>
                                    <Table.Cell className="text-xs text-gray-500">
                                        {batch.batchSize} baris
                                    </Table.Cell>
                                    <Table.Cell>
                                        <SyncStatusChip status={batch.status} />
                                        {batch.abortReason && (
                                            <p className="mt-1 text-xs text-danger">
                                                {batch.abortReason}
                                            </p>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell className="text-xs text-gray-500">
                                        {batch.retryCount}x
                                    </Table.Cell>
                                    <Table.Cell className="text-xs text-gray-500">
                                        {batch.finishedAt
                                            ? new Date(batch.finishedAt).toLocaleString("id-ID")
                                            : "-"}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex gap-2">
                                            {batch.status === "failed" && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    Retry
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    Hapus
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
