"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@heroui/react";
import AlihStatusNodin from "./nodin";
import { actionGetListNodinWithDetail } from "@/action/alih-status/nodin/action.read";
import {
    actionDeleteBerkasAlihStatusNodin,
    actionGetPresignedUrlBerkasAlihStatusNodin,
    actionGetPreviewUrlBerkasAlihStatusNodin,
    actionUpdateBerkasAlihStatusNodin,
} from "@/action/alih-status/nodin/action.berkas";
import DetailBAPenelitian from "../../_component/baPenelitian";
import DetailPermohonan from "../../_component/permohonan";
import DetailSPKMB from "../../_component/spkmb";
import DetailData from "../../_component/data";
import AlihStatusTrackingTimeline from "../../_component/tracking";
import { PreviewBerkas } from "@/component/berkas/previewBerkas";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";


export default function Content({ nodinId }: { nodinId: number }) {
    const queryKey = ["alih-status", "nodin", nodinId]
    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await actionGetListNodinWithDetail(nodinId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const queryClient = useQueryClient()

    return <>
        <Alert status={query.data?.nodin.isDone ? "accent" : "warning"}>
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>
                    Nodin {query.data?.nodin.isDone ? "telah selesai" : "belum selesai"}
                </Alert.Title>
            </Alert.Content>
        </Alert>
        <div className="flex gap-4">
            <div className="flex flex-col gap-4">
                <AlihStatusNodin query={query} queryKey={queryKey} />
                <DetailBAPenelitian
                    data={query.data?.BAPenelitian ?? []}
                    isLoading={query.isLoading}
                />
                <DetailPermohonan
                    data={query.data?.permohonan ?? []}
                    isLoading={query.isLoading}
                />
                <DetailSPKMB
                    data={query.data?.spkmb ?? []}
                    isLoading={query.isLoading}
                />
                <DetailData
                    data={query.data?.data ?? []}
                    isLoading={query.isLoading}
                />
            </div>
            <div className="flex flex-col gap-4">
                <PreviewBerkas
                    title="Berkas Nodin"
                    fileKey={query.data?.nodin.keyBerkas}
                    isLoading={query.isLoading}
                    isError={query.isError}
                    errorMessage={query.error?.message}
                    onRetry={() => query.refetch()}
                    getPreviewUrl={() => actionGetPreviewUrlBerkasAlihStatusNodin(nodinId)}
                    getPresignedUrl={() => actionGetPresignedUrlBerkasAlihStatusNodin(nodinId)}
                    updateBerkas={(key) => actionUpdateBerkasAlihStatusNodin(nodinId, key)}
                    deleteBerkas={() => actionDeleteBerkasAlihStatusNodin(nodinId)}
                    onChange={(key, result) =>
                        queryClient.setQueryData<typeof query.data>(queryKey, (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                nodin: {
                                    ...old.nodin,
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
                    sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_NODIN}
                    sourceId={nodinId}
                    data={query.data?.tracking ?? []}
                    isLoading={query.isLoading}
                    queryKey={queryKey}
                />
            </div>
        </div>
    </>
}