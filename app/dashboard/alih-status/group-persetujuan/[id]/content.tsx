"use client";

import { useState, useEffect } from "react";
import {
    Button,
    toast,
    Card,
    Skeleton,
} from "@heroui/react";
import { actionGetDetailAlihStatusGroupPersetujuan } from "@/action/alih-status/groupPersetujuan/action.read";
import { AlihStatusGroupPersetujuanContract } from "@/action/alih-status/groupPersetujuan/contract";
import AlihStatusGroupMaster from "./groupMaster";
import AlihStatusNodin from "./nodin";
import AlihStatusPersetujuanBupati from "./persetujuan-bupati";
import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract";
import { generateDocument } from "@/lib/generateDoc";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { sumDecimal } from "../../_component/tableData";
import { formatRupiah } from "@/lib/number";
import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract";

export default function Content({ groupId }: { groupId: number }) {

    const [loadingMaster, setLoadingMaster] = useState(true);
    const [data, setData] = useState<AlihStatusDataContract.SelectDTO[]>([])
    const [persetujuanBupati, setPersetujuanBupati] = useState<AlihStatusPersetujuanBupatiContract.SelectDTO | null>(null);
    const [nodin, setNodin] = useState<AlihStatusNodinContract.SelectDTO | null>(null);


    const [group, setGroup] = useState<AlihStatusGroupPersetujuanContract.SelectDTO | null>(null)

    const getDetailAlihStatusMaster = async () => {
        try {
            setLoadingMaster(true);
            const res = await actionGetDetailAlihStatusGroupPersetujuan(groupId);
            if (!res.success) throw res.error
            setGroup(res.data)
        } catch (error: any) {
            toast.danger("Gagal mendapatkan detail group alih status", { description: error.message });
        } finally {
            setLoadingMaster(false)
        }

    }

    const generetePersetujuanBupati = () => {
        try {
            if (!persetujuanBupati) throw new Error("Persetujuan belum ada");
            if (!nodin) throw new Error("Nota Dinas belum ada");

            const perangkatDaerahUnik =
                new Set(
                    data
                        .map((item) => item.perangkatDaerahAsal)
                )

            const perangkatDaerahAsal =
                perangkatDaerahUnik.size > 1
                    ? `${perangkatDaerahUnik.size} Perangkat Daerah`
                    : [...perangkatDaerahUnik][0] ?? "";

            generateDocument("/template/alih-status/persetujuan-bupati.docx", `Persetujuan Bupati `, {
                "nodin-hal": nodin?.suratHal,
                "nodin-nomor": nodin?.suratNomor,
                "nodin-tanggal": nodin?.suratTanggal ? new Date(
                    `${nodin.suratTanggal}T00:00:00`
                ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }) : `               ${new Date().getFullYear()}`,
                "persetujuan-hal": persetujuanBupati.suratHal ?? `Persetujuan Pengalihan Status Penggunaan Barang Milik Daerah dari ${perangkatDaerahAsal}`,
                "persetujuan-nomor": persetujuanBupati.suratNomor ?? `000.2.3.2/          /202/${new Date().getFullYear()}`,
                "persetujuan-tanggal": persetujuanBupati.suratTanggal ? new Date(
                    `${persetujuanBupati.suratTanggal}T00:00:00`
                ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }) : `               ${new Date().getFullYear()}`,
                "perangkat-daerah-asal": perangkatDaerahAsal,
                "data": data.map((item, index) => ({ ...item, no: index + 1, nilaiPerolehan: formatRupiah(item.nilaiPerolehan), akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan), nilaiBuku: formatRupiah(item.nilaiBuku) })),
                "total-data": data.length,
                "total-perolehan": formatRupiah(sumDecimal(data, "nilaiPerolehan")),
                "total-penyusutan": formatRupiah(sumDecimal(data, "akumulasiPenyusutan")),
                "total-buku": formatRupiah(sumDecimal(data, "nilaiBuku"))
            })
        } catch (error: any) {
            toast.danger("Gagal mencetak dokumen persetujuan bupati. " + error.message)
        }
    }

    useEffect(() => {
        getDetailAlihStatusMaster();
    }, [groupId]);

    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Data Group Alih Status</Card.Title>
                </Card.Header>
                <Card.Content>{
                    loadingMaster ?
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-3/5 rounded-lg" />
                            <Skeleton className="h-3 w-4/5 rounded-lg" />
                            <Skeleton className="h-3 w-2/5 rounded-lg" />
                        </div>
                        :
                        group === null ?
                            <div> Data Tidak Ditemukan</div>
                            :
                            <ul>
                                <li>Nama Group : {group.nama}</li>
                            </ul>

                }
                </Card.Content>
            </Card>
            <AlihStatusGroupMaster groupId={groupId} data={data} setData={setData} />
            <AlihStatusNodin groupId={groupId} nodin={nodin} setNodin={setNodin} />
            <AlihStatusPersetujuanBupati groupId={groupId} persetujuanBupati={persetujuanBupati} onLoad={setPersetujuanBupati} onGenerate={generetePersetujuanBupati} />

        </>
    );
}
