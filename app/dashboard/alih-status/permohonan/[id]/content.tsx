"use client"
import { useQuery } from "@tanstack/react-query";
import { actionGetDetailAlihStatusPermohonanWithDetail } from "@/action/alih-status/permohonan/action.read";
import AlihStatusSpkmb from "./spkmb";
import AlihStatusPermohonan from "./permohonan";
import AlihStatusData from "./data";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
import AlihStatusTrackingTimeline from "../../_component/tracking";


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

    return <>
        <AlihStatusPermohonan query={query} queryKey={queryKey} />
        <AlihStatusTrackingTimeline
            sourceType={AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN}
            sourceId={permohonanId}
            data={query.data?.tracking ?? []}
            isLoading={query.isLoading}
            queryKey={queryKey}
        />
        <AlihStatusData permohonanId={permohonanId}
            query={query}
            queryKey={queryKey} />
        <AlihStatusSpkmb query={query} queryKey={queryKey} />
    </>
}