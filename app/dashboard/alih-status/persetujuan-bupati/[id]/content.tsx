"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@heroui/react";
import AlihStatusPersetujuanBupati from "./persetujuan-bupati";
import { actionGetListPersetujuanBupatiWithDetail } from "@/action/alih-status/persetujuan-bupati/action.read";
import {
    actionDeleteBerkasAlihStatusPersetujuanBupati,
    actionGetPresignedUrlBerkasAlihStatusPersetujuanBupati,
    actionGetPreviewUrlBerkasAlihStatusPersetujuanBupati,
    actionUpdateBerkasAlihStatusPersetujuanBupati,
} from "@/action/alih-status/persetujuan-bupati/action.berkas";
import DetailNodin from "../../_component/nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import AlihStatusTrackingTimeline from "../../_component/tracking";
import { PreviewBerkas } from "@/component/berkas/previewBerkas";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";


export default function Content({ persetujuanId }: { persetujuanId: number }) {
    const queryKey = ["alih-status", "persetujuanBupati", persetujuanId]
    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await actionGetListPersetujuanBupatiWithDetail(persetujuanId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const queryClient = useQueryClient()

    return <>
        <Alert status={query.data?.persetujuanBupati.isDone ? "accent" : "warning"}>
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>
                    Persetujuan Bupati {query.data?.persetujuanBupati.isDone ? "telah selesai" : "belum selesai"}
                </Alert.Title>
            </Alert.Content>
        </Alert>
        <div className="flex gap-4">
            <div className="flex flex-col gap-4">
                <AlihStatusPersetujuanBupati query={query} queryKey={queryKey} />
                <DetailNodin
                    data={query.data?.nodin ?? []}
                    isLoading={query.isLoading}
                />
                <DetailBAPenelitian
                    data={query.data?.BAPenelitian ?? []}
                    isLoading={query.isLoading}
                />
                <DetailPermohonan
                    data={query.data?.permohonan ?? []}
                    isLoading={query.isLoading}
                />
                <DetailData
                    data={query.data?.data ?? []}
                    isLoading={query.isLoading}
                />
            </div>
            <div className="flex flex-col gap-4">
                <PreviewBerkas
                    title="Berkas Persetujuan Bupati"
                    fileKey={query.data?.persetujuanBupati.keyBerkas}
                    isLoading={query.isLoading}
                    isError={query.isError}
                    errorMessage={query.error?.message}
                    onRetry={() => query.refetch()}
                    getPreviewUrl={() => actionGetPreviewUrlBerkasAlihStatusPersetujuanBupati(persetujuanId)}
                    getPresignedUrl={() => actionGetPresignedUrlBerkasAlihStatusPersetujuanBupati(persetujuanId)}
                    updateBerkas={(key) => actionUpdateBerkasAlihStatusPersetujuanBupati(persetujuanId, key)}
                    deleteBerkas={() => actionDeleteBerkasAlihStatusPersetujuanBupati(persetujuanId)}
                    onChange={(key, result) =>
                        queryClient.setQueryData<typeof query.data>(queryKey, (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                persetujuanBupati: {
                                    ...old.persetujuanBupati,
                                    keyBerkas: key,
                                    // isDone hanya diubah bila ada hasil dari update (upload)
                                    ...(result ? { isDone: result.isDone } : {}),
                                },
                                // tracking baru ditaruh paling depan
                                tracking: result
                                    ? [result.tracking, ...(old.tracking ?? [])]
                                    : old.tracking,
                            }
                        })
                    }
                />
                <AlihStatusTrackingTimeline
                    sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_PERSETUJUAN_BUPATI}
                    sourceId={persetujuanId}
                    data={query.data?.tracking ?? []}
                    isLoading={query.isLoading}
                    queryKey={queryKey}
                />
            </div>
        </div>
    </>
}