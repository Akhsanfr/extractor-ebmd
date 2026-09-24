"use client"
import { useQuery } from "@tanstack/react-query";
import DetailPersetujuanBupati from "../../_component/persetujuanBupati";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import DetailNodin from "../../_component/nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";
import { actionGetListPermohonanPenghapusanWithDetail } from "@/action/alih-status/permohonan-penghapusan/action.read";
import AlihStatusPermohonanPenghapusan from "./permohonanPenghapusan";
import DetailBAST from "../../_component/bast";


export default function Content({ permohonanPenghapusanId }: { permohonanPenghapusanId: number }) {
    const queryKey = ["alih-status", "permohonan-penghapusan", permohonanPenghapusanId]
    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const res = await actionGetListPermohonanPenghapusanWithDetail(permohonanPenghapusanId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const data = query.data

    return <>
        <AlihStatusPermohonanPenghapusan query={query} queryKey={queryKey} />
        <DetailBAST
            data={query.data?.bast ?? []} isLoading={query.isLoading}
        />
        <DetailPersetujuanBupati
            data={query.data?.persetujuanBupati ?? []} isLoading={query.isLoading}
        />
        <DetailNodin
            data={query.data?.nodin ?? []} isLoading={query.isLoading}
        />
        <DetailBAPenelitian
            data={query.data?.BAPenelitian ?? []} isLoading={query.isLoading}
        />
        <DetailPermohonan
            data={query.data?.permohonan ?? []} isLoading={query.isLoading}
        />
        <DetailData
            data={data?.data ?? []}
            isLoading={query.isLoading}
        />

    </>
}