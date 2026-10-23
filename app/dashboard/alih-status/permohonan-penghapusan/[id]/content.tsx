"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@heroui/react";
import AlihStatusPermohonanPenghapusan from "./permohonanPenghapusan";
import { actionGetListPermohonanPenghapusanWithDetail } from "@/action/alih-status/permohonan-penghapusan/action.read";
import {
    actionDeleteBerkasAlihStatusPermohonanPenghapusan,
    actionGetPresignedUrlBerkasAlihStatusPermohonanPenghapusan,
    actionGetPreviewUrlBerkasAlihStatusPermohonanPenghapusan,
    actionUpdateBerkasAlihStatusPermohonanPenghapusan,
} from "@/action/alih-status/permohonan-penghapusan/action.berkas";
import DetailBAST from "../../_component/bast";
import DetailPersetujuanBupati from "../../_component/persetujuanBupati";
import DetailNodin from "../../_component/nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import AlihStatusTrackingTimeline from "../../_component/tracking";
import { PreviewBerkas } from "@/component/berkas/previewBerkas";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";


export default function Content({ permohonanPenghapusanId }: { permohonanPenghapusanId: number }) {
    const queryKey = ["alih-status", "permohonan-penghapusan", permohonanPenghapusanId]
    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await actionGetListPermohonanPenghapusanWithDetail(permohonanPenghapusanId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const queryClient = useQueryClient()

    return <>
        <Alert status={query.data?.permohonanPenghapusan.isDone ? "accent" : "warning"}>
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>
                    Permohonan penghapusan {query.data?.permohonanPenghapusan.isDone ? "telah selesai" : "belum selesai"}
                </Alert.Title>
            </Alert.Content>
        </Alert>
        <div className="flex gap-4">
            <div className="flex flex-col gap-4">
                <AlihStatusPermohonanPenghapusan query={query} queryKey={queryKey} />
                <DetailBAST
                    data={query.data?.bast ?? []}
                    isLoading={query.isLoading}
                />
                <DetailPersetujuanBupati
                    data={query.data?.persetujuanBupati ?? []}
                    isLoading={query.isLoading}
                />
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
                    title="Berkas Permohonan Penghapusan"
                    fileKey={query.data?.permohonanPenghapusan.keyBerkas}
                    isLoading={query.isLoading}
                    isError={query.isError}
                    errorMessage={query.error?.message}
                    onRetry={() => query.refetch()}
                    getPreviewUrl={() => actionGetPreviewUrlBerkasAlihStatusPermohonanPenghapusan(permohonanPenghapusanId)}
                    getPresignedUrl={() => actionGetPresignedUrlBerkasAlihStatusPermohonanPenghapusan(permohonanPenghapusanId)}
                    updateBerkas={(key) => actionUpdateBerkasAlihStatusPermohonanPenghapusan(permohonanPenghapusanId, key)}
                    deleteBerkas={() => actionDeleteBerkasAlihStatusPermohonanPenghapusan(permohonanPenghapusanId)}
                    onChange={(key, result) =>
                        queryClient.setQueryData<typeof query.data>(queryKey, (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                permohonanPenghapusan: {
                                    ...old.permohonanPenghapusan,
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
                    sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN_PENGHAPUSAN}
                    sourceId={permohonanPenghapusanId}
                    data={query.data?.tracking ?? []}
                    isLoading={query.isLoading}
                    queryKey={queryKey}
                />
            </div>
        </div>
    </>
}