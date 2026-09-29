"use client"
import { useQuery } from "@tanstack/react-query";
import AlihStatusBAPenelitian from "./ba-penelitian";
import { actionGetListBAPenelitianWithDetail } from "@/action/alih-status/ba-penelitian/action.read";
import DetailPermohonan from "../../_component/permohonan";
import { AlihStatusTabelData } from "../../_component/data/tableData";
import AlihStatusTrackingTimeline from "../../_component/tracking";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";


export default function Content({ permohonanId }: { permohonanId: number }) {
    const queryKey = ["alih-status", "ba-penelitian", permohonanId]
    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const res = await actionGetListBAPenelitianWithDetail(permohonanId)
            if (!res.success) throw res.error
            return res.data
        }
    })

    return <>
        <AlihStatusBAPenelitian query={query} queryKey={queryKey} />
        <AlihStatusTrackingTimeline
            sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_BA_PENELITIAN}
            sourceId={permohonanId}
            data={query.data?.tracking ?? []}
            isLoading={query.isLoading}
            queryKey={queryKey}
        />
        <DetailPermohonan
            data={query.data?.permohonan ?? []} isLoading={query.isLoading}
        />

        <AlihStatusTabelData data={query.data?.data ?? []} isLoading={query.isLoading} />
    </>
}