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
import { BAPenelitianFormModal } from "./modal";
import { Edit, Trash } from "lucide-react";
import { AlihStatusBAPenelitianContract } from "@/action/alih-status/ba-penelitian/contract";
import { actionDeleteAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.delete";
import { actionGetListAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.read";

export default function PageBAPenelitianAlihStatus() {
    const [data, setData] = useState<AlihStatusBAPenelitianContract.SelectDTO[]>([]);
    const [formTarget, setFormTarget] = useState<
        AlihStatusBAPenelitianContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusBAPenelitian({ id });
            if (!result.success) {
                throw result.error;
            }
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("BA Penelitian Alih Status berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus ba penelitian alih status", { description: error.message });
        }
    };

    const getListData = async () => {
        try {
            const res = await actionGetListAlihStatusBAPenelitian();
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan ba penelitian alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getListData();
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end">
                <Button onPress={() => setFormTarget(null)}>
                    Tambah BA Penelitian Alih Status
                </Button>
            </div>

            <Table aria-label="Tabel ba penelitian alih status">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Tabel ba penelitian alih status">
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

            {formTarget !== undefined && (
                <BAPenelitianFormModal
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
