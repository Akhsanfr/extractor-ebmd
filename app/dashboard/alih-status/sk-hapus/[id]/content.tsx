"use client"
import { useQuery } from "@tanstack/react-query";
import DetailPersetujuanBupati from "../../_component/persetujuanBupati";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import DetailNodin from "../../_component/nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";
import { actionGetListSKHapusWithDetail } from "@/action/alih-status/sk-hapus/action.read";
import AlihStatusSKHapus from "./SKHapus";
import DetailBAST from "../../_component/bast";
import DetailPermohonanPenghapusan from "../../_component/permohonanPenghapusan";


export default function Content({ SKHapusId }: { SKHapusId: number }) {
    const queryKey = ["alih-status", "sk-hapus", SKHapusId]
    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const res = await actionGetListSKHapusWithDetail(SKHapusId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const data = query.data

    return <>
        <AlihStatusSKHapus query={query} queryKey={queryKey} />
        <DetailPermohonanPenghapusan
            data={query.data?.permohonanPenghapusan ?? []} isLoading={query.isLoading}
        />
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