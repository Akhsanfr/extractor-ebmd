"use client"
import { useQuery } from "@tanstack/react-query";
import { actionGetListNodinWithDetail } from "@/action/alih-status/nodin/action.read";
import AlihStatusNodin from "./nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import DetailSPKMB from "../../_component/spkmb";


export default function Content({ nodinId }: { nodinId: number }) {
    const KEY = ["alih-status", "nodin", nodinId]
    const query = useQuery({
        queryKey: KEY,
        queryFn: async () => {
            const res = await actionGetListNodinWithDetail(nodinId)
            if (!res.success) throw res.error
            return res.data
        }
    })

    return <>
        <AlihStatusNodin query={query} queryKey={KEY} />
        <DetailBAPenelitian data={query.data?.BAPenelitian ?? []} isLoading={query.isLoading} />
        <DetailPermohonan data={query.data?.permohonan ?? []} isLoading={query.isLoading} />
        <DetailSPKMB data={query.data?.spkmb ?? []} isLoading={query.isLoading} />
        <DetailData data={query.data?.data ?? []} isLoading={query.isLoading} />
    </>
}