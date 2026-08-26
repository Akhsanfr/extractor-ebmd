"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    toast,
} from "@heroui/react";
import { PermohonanPenghapusanFormModal } from "./modal";
import { Edit, Trash } from "lucide-react";
import { AlihStatusPermohonanPenghapusanContract } from "@/action/alih-status/permohonan-penghapusan/contract";
import { actionDeleteAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.delete";
import { actionGetListAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.read";

export default function PagePermohonanPenghapusanAlihStatus() {
    const [data, setData] = useState<AlihStatusPermohonanPenghapusanContract.SelectDTO[]>([]);
    const [formTarget, setFormTarget] = useState<
        AlihStatusPermohonanPenghapusanContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusPermohonanPenghapusan({ id });
            if (!result.success) {
                throw result.error;
            }
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("Permohonan Penghapusan Alih Status berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus permohonan penghapusan alih status", { description: error.message });
        }
    };

    const getListData = async () => {
        try {
            const res = await actionGetListAlihStatusPermohonanPenghapusan();
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan permohonan penghapusan alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getListData();
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end">
                <Button onPress={() => setFormTarget(null)}>
                    Tambah Permohonan Penghapusan Alih Status
                </Button>
            </div>

            <Table aria-label="Tabel permohonan penghapusan alih status">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Tabel permohonan penghapusan alih status">
                        <TableHeader>
                            <TableColumn isRowHeader>ID Master</TableColumn>
                            <TableColumn>Nomor Surat</TableColumn>
                            <TableColumn>Tanggal Surat</TableColumn>
                            <TableColumn>Aksi</TableColumn>
                        </TableHeader>
                        <TableBody items={data}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.masterId}</TableCell>
                                    <TableCell>{item.suratNomor}</TableCell>
                                    <TableCell>{item.suratTanggal}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onPress={() => setFormTarget(item)}
                                            >
                                                <Edit />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onPress={() => handleDelete(item.id)}
                                            >
                                                <Trash />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            {/* {formTarget !== undefined && (
                <PermohonanPenghapusanFormModal
                masterId={masterId}
                    target={formTarget}
                    onClose={() => {
                        setFormTarget(undefined);
                        getListData();
                    }}
                />
            )} */}
        </div>
    );
}
