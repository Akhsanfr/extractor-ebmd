"use client"
import { useQuery } from "@tanstack/react-query";
import AlihStatusBAPenelitian from "./ba-penelitian";
import { actionGetListBAPenelitianWithDetail } from "@/action/alih-status/ba-penelitian/action.read";
import DetailPermohonan from "../../_component/permohonan";
import { AlihStatusTabelData } from "../../_component/data/tableData";


export default function Content({ permohonanId }: { permohonanId: number }) {
    const KEY = ["alih-status", "permohonan", permohonanId]
    const query = useQuery({
        queryKey: KEY,
        queryFn: async () => {
            const res = await actionGetListBAPenelitianWithDetail(permohonanId)
            if (!res.success) throw res.error
            return res.data
        }
    })

    return <>
        <AlihStatusBAPenelitian query={query} queryKey={KEY} />
        <DetailPermohonan
            data={query.data?.permohonan ?? []} isLoading={query.isLoading}
        />
        <AlihStatusTabelData data={query.data?.data ?? []} isLoading={query.isLoading} />
    </>
}