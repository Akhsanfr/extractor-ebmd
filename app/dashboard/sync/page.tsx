"use client";
import { actionGetSyncJobs } from "@/action/sync/syncJob/syncJob.action.read";
import { SyncJobTable } from "./table";
import { CreateSyncJobModal } from "./modal";
import { SyncJobContract } from "@/action/sync/syncJob/syncJob.contract";
import { useEffect, useState } from "react";
import { toast } from "@heroui/react";

export default function SyncJobListPage() {

    const [syncJob, setSyncJob] = useState<SyncJobContract.SelectWithProgressDTO[]>([]);

    const getSyncJob = async () => {
        try {
            const res = await actionGetSyncJobs();
            if (!res.success) throw res.error;
            setSyncJob(res.data)
        } catch (error: any) {
            toast.danger("Gagal memuat data sync Job. ", { description: error.message })
        }
    }
    useEffect(() => { getSyncJob() }, [])

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">
                        Synchronization Framework
                    </h1>
                    <p className="text-sm text-gray-500">
                        Monitoring proses sinkronisasi data dari EBMD, SIMPEG, SIPD,
                        dan sumber lainnya.
                    </p>
                </div>

                <CreateSyncJobModal onSuccess={() => getSyncJob()} />
            </div>

            <SyncJobTable syncJobs={syncJob} />
        </div>
    );
}
