"use client"
import { useQuery } from "@tanstack/react-query";
import DetailPersetujuanBupati from "../../_component/persetujuanBupati";
import DetailPermohonan from "../../_component/permohonan";
import DetailData from "../../_component/data";
import DetailNodin from "../../_component/nodin";
import DetailBAPenelitian from "../../_component/baPenelitian";
import { actionGetListBASTWithDetail } from "@/action/alih-status/bast/action.read";
import DetailBAST from "../../_component/bast";
import AlihStatusBAST from "./bast";


export default function Content({ bastId }: { bastId: number }) {
    const queryKey = ["alih-status", "bast", bastId]
    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const res = await actionGetListBASTWithDetail(bastId)
            if (!res.success) throw res.error
            return res.data
        }
    })
    const data = query.data

    return <>
        <AlihStatusBAST query={query} queryKey={queryKey} />
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