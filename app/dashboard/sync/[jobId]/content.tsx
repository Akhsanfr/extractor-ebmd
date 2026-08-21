"use client";
import Link from "next/link";
import { SyncStatusChip } from "@/component/SyncStatusChip";
import { useEffect, useState } from "react";
import { SyncListContract } from "@/action/sync/syncList/syncList.contract";
import { Button, EmptyState, ProgressBar, Table, toast } from "@heroui/react";
import { actionGetSyncListsByJobId } from "@/action/sync/syncList/syncList.action.read";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Content({ jobId }: { jobId: number }) {
    const [syncList, setSyncList] = useState<SyncListContract.SelectWithProgressDTO[]>([])

    const getSyncList = async () => {
        try {
            const result = await actionGetSyncListsByJobId(jobId);
            if (!result.success) {
                throw result.error
            }
            setSyncList(result.data)
        } catch (error: any) {
            toast.danger("Gagal memuat data sync Job")
        }
    }

    useEffect(() => { getSyncList() }, [])

    const router = useRouter();

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <Link
                    href="/dashboard/sync"
                    className="text-sm text-primary hover:underline"
                >
                    ← Kembali ke daftar Sync Job
                </Link>
            </div>

            <Table aria-label="Daftar Sync List">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Daftar Sync List">
                        <Table.Header>
                            <Table.Column isRowHeader >Payload</Table.Column>
                            <Table.Column>Status</Table.Column>
                            <Table.Column>Progress Batch</Table.Column>
                            <Table.Column>Aksi</Table.Column>
                        </Table.Header>

                        <Table.Body
                            renderEmptyState={() => (
                                <EmptyState
                                    title="Belum ada Sync List"
                                // description="Sync List akan muncul setelah Job diproses."
                                />
                            )}
                        >
                            {syncList.map((list) => {
                                const progress =
                                    list.totalBatch === 0
                                        ? 0
                                        : Math.round(
                                            (list.completedBatch / list.totalBatch) * 100
                                        );

                                const canDelete =
                                    list.status !== "pending" && list.status !== "processing";

                                return (
                                    <Table.Row key={list.id}>
                                        <Table.Cell>
                                            {JSON.stringify(list.payload)}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <SyncStatusChip status={list.status} />
                                            {list.lastError && (
                                                <p className="mt-1 text-xs text-danger">
                                                    {list.lastError}
                                                </p>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell className="min-w-[180px]">
                                            <div className="flex flex-col gap-1">
                                                <ProgressBar
                                                    value={progress}
                                                    aria-label="Progress batch list"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    {list.completedBatch}/{list.totalBatch} batch
                                                    {list.failedBatch > 0 &&
                                                        ` · ${list.failedBatch} gagal`}
                                                </span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                {list.status === "failed" && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                    // isDisabled={isPending}
                                                    // onPress={() => handleRetry(list.id)}
                                                    >
                                                        Retry
                                                    </Button>
                                                )}
                                                <Button onPress={() => router.push(`/dashboard/sync/${jobId}/list`)}>
                                                    <Eye />
                                                </Button>

                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        </div>
    );
}
