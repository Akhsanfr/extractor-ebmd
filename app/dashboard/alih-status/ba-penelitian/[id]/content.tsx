"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@heroui/react";
import AlihStatusBAPenelitian from "./ba-penelitian";
import { actionGetListBAPenelitianWithDetail } from "@/action/alih-status/ba-penelitian/action.read";
import {
    actionDeleteBerkasAlihStatusBAPenelitian,
    actionGetPresignedUrlBerkasAlihStatusBAPenelitian,
    actionGetPreviewUrlBerkasAlihStatusBAPenelitian,
    actionUpdateBerkasAlihStatusBAPenelitian,
} from "@/action/alih-status/ba-penelitian/action.berkas";
import DetailPermohonan from "../../_component/permohonan";
import { AlihStatusTabelData } from "../../_component/data/tableData";
import AlihStatusTrackingTimeline from "../../_component/tracking";
import { PreviewBerkas } from "@/component/berkas/previewBerkas";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";


export default function Content({ permohonanId }: { permohonanId: number }) {
    const queryKey = ["alih-status", "ba-penelitian", permohonanId]
    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await actionGetListBAPenelitianWithDetail(permohonanId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const queryClient = useQueryClient()

    return <>
        <Alert status={query.data?.BAPenelitian.isDone ? "accent" : "warning"}>
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>
                    BA Penelitian {query.data?.BAPenelitian.isDone ? "telah selesai" : "belum selesai"}
                </Alert.Title>
            </Alert.Content>
        </Alert>
        <div className="flex gap-4">
            <div className="flex flex-col gap-4">
                <AlihStatusBAPenelitian query={query} queryKey={queryKey} />
                <DetailPermohonan
                    data={query.data?.permohonan ?? []}
                    isLoading={query.isLoading}
                />
                <AlihStatusTabelData
                    data={query.data?.data ?? []}
                    isLoading={query.isLoading}
                />
            </div>
            <div className="flex flex-col gap-4">
                <PreviewBerkas
                    title="Berkas BA Penelitian"
                    fileKey={query.data?.BAPenelitian.keyBerkas}
                    isLoading={query.isLoading}
                    isError={query.isError}
                    errorMessage={query.error?.message}
                    onRetry={() => query.refetch()}
                    getPreviewUrl={() => actionGetPreviewUrlBerkasAlihStatusBAPenelitian(permohonanId)}
                    getPresignedUrl={() => actionGetPresignedUrlBerkasAlihStatusBAPenelitian(permohonanId)}
                    updateBerkas={(key) => actionUpdateBerkasAlihStatusBAPenelitian(permohonanId, key)}
                    deleteBerkas={() => actionDeleteBerkasAlihStatusBAPenelitian(permohonanId)}
                    onChange={(key, result) =>
                        queryClient.setQueryData<typeof query.data>(queryKey, (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                BAPenelitian: {
                                    ...old.BAPenelitian,
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
                    sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_BA_PENELITIAN}
                    sourceId={permohonanId}
                    data={query.data?.tracking ?? []}
                    isLoading={query.isLoading}
                    queryKey={queryKey}
                />
            </div>
        </div>
    </>
}