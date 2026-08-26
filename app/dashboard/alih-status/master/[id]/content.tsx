"use client";

import { useState, useEffect } from "react";
import {
    Button,
    toast,
    Card,
    Skeleton,
} from "@heroui/react";
import { actionGetDetailAlihStatusMaster } from "@/action/alih-status/master/action.read";
import { AlihStatusMasterContract } from "@/action/alih-status/master/contract";
import AlihStatusData from "./data";
import AlihStatusSpkmb from "./spkmb";
import AlihStatusPermohonan from "./permohonan";

export default function Content({ masterId }: { masterId: number }) {

    const [loadingMaster, setLoadingMaster] = useState(true);
    const [master, setMaster] = useState<AlihStatusMasterContract.SelectDTO | null>(null)

    const getDetailAlihStatusMaster = async () => {
        try {
            setLoadingMaster(true);
            const res = await actionGetDetailAlihStatusMaster(masterId);
            if (!res.success) throw res.error
            setMaster(res.data)
        } catch (error: any) {
            toast.danger("Gagal mendapatkan detail master alih status", { description: error.message });
        } finally {
            setLoadingMaster(false)
        }

    }

    useEffect(() => {
        getDetailAlihStatusMaster();
    }, [masterId]);

    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Data Master Alih Status</Card.Title>
                </Card.Header>
                <Card.Content>{
                    loadingMaster ?
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-3/5 rounded-lg" />
                            <Skeleton className="h-3 w-4/5 rounded-lg" />
                            <Skeleton className="h-3 w-2/5 rounded-lg" />
                        </div>
                        :
                        master === null ?
                            <div> Data Tidak Ditemukan</div>
                            :
                            <ul>
                                <li>Perangkat Daerah : {master.perangkatDaerahAsal}</li>
                                <li>Pengguna Barang : {master.penggunaBarangNama}</li>
                                <li>Pangkat Pengguna Barang : {master.penggunaBarangPangkat}</li>
                                <li>NIP Pengguna Barang : {master.penggunaBarangNIP}</li>
                                <li>Pengurus Barang : {master.pengurusBarangNama}</li>
                            </ul>

                }
                </Card.Content>
            </Card>
            <AlihStatusSpkmb masterId={masterId} />
            <AlihStatusPermohonan masterId={masterId} />
            <AlihStatusData masterId={masterId} />
        </>
    );
}
