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
import { SKHapusFormModal } from "./modal";
import { Edit, Trash } from "lucide-react";
import { AlihStatusSKHapusContract } from "@/action/alih-status/sk-hapus/contract";
import { actionDeleteAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.delete";
import { actionGetListAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.read";

export default function PageSKHapusAlihStatus() {
    const [data, setData] = useState<AlihStatusSKHapusContract.SelectDTO[]>([]);
    const [formTarget, setFormTarget] = useState<
        AlihStatusSKHapusContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusSKHapus({ id });
            if (!result.success) {
                throw result.error;
            }
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("SK Hapus Alih Status berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus sk hapus alih status", { description: error.message });
        }
    };

    const getListData = async () => {
        try {
            const res = await actionGetListAlihStatusSKHapus();
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan sk hapus alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getListData();
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end">
                <Button onPress={() => setFormTarget(null)}>
                    Tambah SK Hapus Alih Status
                </Button>
            </div>

            <Table aria-label="Tabel sk hapus alih status">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Tabel sk hapus alih status">
                        <TableHeader>
                            <TableColumn isRowHeader>ID Group</TableColumn>
                            <TableColumn>Nomor Surat</TableColumn>
                            <TableColumn>Tanggal Surat</TableColumn>
                            <TableColumn>Aksi</TableColumn>
                        </TableHeader>
                        <TableBody items={data}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.groupId}</TableCell>
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

            {formTarget !== undefined && (
                <SKHapusFormModal
                    target={formTarget}
                    onClose={() => {
                        setFormTarget(undefined);
                        getListData();
                    }}
                />
            )}
        </div>
    );
}
