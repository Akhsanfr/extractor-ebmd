"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { actionGetDetailAlihStatusPermohonanWithDetail } from "@/action/alih-status/permohonan/action.read";
import AlihStatusSpkmb from "./spkmb";
import AlihStatusPermohonan from "./permohonan";
import AlihStatusData from "./data";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
import AlihStatusTrackingTimeline from "../../_component/tracking";
import { PreviewBerkas } from "@/component/berkas/previewBerkas";
import { actionDeleteBerkasAlihStatusPermohonan, actionGetPresignedUrlBerkasAlihStatusPermohonan, actionGetPreviewUrlBerkasAlihStatusPermohonan, actionUpdateBerkasAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.berkas";
import { Alert } from "@heroui/react";


export default function Content({ permohonanId }: { permohonanId: number }) {
    const queryKey = ["alih-status", "permohonan", permohonanId]
    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await actionGetDetailAlihStatusPermohonanWithDetail(permohonanId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const queryClient = useQueryClient()

    return <>
        <Alert status={query.data?.permohonan.isDone ? "accent" : "warning"}>
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>Permohonan alih status {query.data?.permohonan.isDone ? "telah selesai" : "belum selesai"}</Alert.Title>
            </Alert.Content>
        </Alert>
        <div className="flex gap-4">
            <div className="flex flex-col gap-4">
                <AlihStatusPermohonan query={query} queryKey={queryKey} />
                <AlihStatusData permohonanId={permohonanId}
                    query={query}
                    queryKey={queryKey} />
                <AlihStatusSpkmb query={query} queryKey={queryKey} />
            </div>
            <div className="flex flex-col gap-4">
                <PreviewBerkas
                    title="Berkas SPKMB"
                    fileKey={query.data?.permohonan.keyBerkas}
                    isLoading={query.isLoading}
                    isError={query.isError}
                    errorMessage={query.error?.message}
                    onRetry={() => query.refetch()}
                    getPreviewUrl={() => actionGetPreviewUrlBerkasAlihStatusPermohonan(permohonanId)}
                    getPresignedUrl={() => actionGetPresignedUrlBerkasAlihStatusPermohonan(permohonanId)}
                    updateBerkas={(key) => actionUpdateBerkasAlihStatusPermohonan(permohonanId, key)}
                    deleteBerkas={() => actionDeleteBerkasAlihStatusPermohonan(permohonanId)}
                    onChange={(key, result) =>
                        queryClient.setQueryData<typeof query.data>(queryKey, (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                permohonan: {
                                    ...old.permohonan,
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
                    sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN}
                    sourceId={permohonanId}
                    data={query.data?.tracking ?? []}
                    isLoading={query.isLoading}
                    queryKey={queryKey}
                />
            </div>
        </div>
    </>
}