"use client"
import { useQuery } from "@tanstack/react-query";
import { actionGetDetailAlihStatusPermohonanWithDetail } from "@/action/alih-status/permohonan/action.read";
import AlihStatusSpkmb from "./spkmb";
import AlihStatusPermohonan from "./permohonan";
import { AlihStatusTabelData } from "../../_component/data/tableData";
import AlihStatusData from "./data";


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
    console.log(query.data)

    return <>
        <AlihStatusPermohonan query={query} queryKey={queryKey} />
        <AlihStatusData permohonanId={permohonanId}
            query={query}
            queryKey={queryKey} />
        <AlihStatusSpkmb query={query} queryKey={queryKey} />
    </>
}