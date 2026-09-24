"use client"
import { useQuery } from "@tanstack/react-query";
import { actionGetListPersetujuanBupatiWithDetail } from "@/action/alih-status/persetujuan-bupati/action.read";
import AlihStatusPersetujuanBupati from "./persetujuan-bupati";
import { AlihStatusTabelData } from "../../_component/data/tableData";
import { Label } from "@heroui/react";
import DetailPersetujuanBupati from "../../_component/persetujuanBupati";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import DetailNodin from "../../_component/nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";


export default function Content({ persetujuanId }: { persetujuanId: number }) {
    const KEY = ["alih-status", "persetujuanBupati", persetujuanId]
    const query = useQuery({
        queryKey: KEY,
        queryFn: async () => {
            const res = await actionGetListPersetujuanBupatiWithDetail(persetujuanId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const data = query.data

    return <>
        <AlihStatusPersetujuanBupati
            query={query} queryKey={KEY} />
        {/* <DetailPersetujuanBupati
            data={query.data?.persetujuanBupati ? [query.data?.persetujuanBupati] : []} isLoading={query.isLoading}
        /> */}
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