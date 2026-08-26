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
import { GroupFormModal } from "./modal";
import { Edit, Eye, Trash } from "lucide-react";
import { AlihStatusGroupPersetujuanContract } from "@/action/alih-status/groupPersetujuan/contract";
import { actionDeleteAlihStatusGroup } from "@/action/alih-status/groupPersetujuan/action.delete";
import { actionGetListAlihStatusGroupPersetujuan } from "@/action/alih-status/groupPersetujuan/action.read";
import { useRouter } from "next/navigation";

export default function PageGroupAlihStatus() {
    const [data, setData] = useState<AlihStatusGroupPersetujuanContract.SelectDTO[]>([]);
    const [formTarget, setFormTarget] = useState<
        AlihStatusGroupPersetujuanContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const router = useRouter()

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusGroup({ id });
            if (!result.success) {
                throw result.error;
            }
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("Group Alih Status berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus group alih status", { description: error.message });
        }
    };

    const getListData = async () => {
        try {
            const res = await actionGetListAlihStatusGroupPersetujuan();
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan group alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getListData();
    }, []);

    return (
        <>
            <div className="flex justify-end">
                <Button onPress={() => setFormTarget(null)}>
                    Tambah Group Alih Status
                </Button>
            </div>
            <Table aria-label="Tabel group alih status">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Tabel group alih status">
                        <TableHeader>
                            <TableColumn isRowHeader>Nama Group</TableColumn>
                            <TableColumn>Aksi</TableColumn>
                        </TableHeader>
                        <TableBody items={data}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.nama}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onPress={() => router.push(`/dashboard/alih-status/group-persetujuan/${item.id}`)}
                                            >
                                                <Eye />
                                            </Button>
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
                <GroupFormModal
                    target={formTarget}
                    onClose={() => {
                        setFormTarget(undefined);
                        getListData();
                    }}
                />
            )}
        </>
    );
}
