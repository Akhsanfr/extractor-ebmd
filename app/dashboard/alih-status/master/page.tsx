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
    Chip,
} from "@heroui/react";
import { ContentFormModal } from "./modal";
import { Edit, Eye, Trash } from "lucide-react";
import { AlihStatusMasterContract } from "@/action/alih-status/master/contract";
import { actionDeleteAlihStatusMaster } from "@/action/alih-status/master/action.delete";
import { actionGetListAlihStatusMaster, actionGetListAlihStatusMasterWithSumData } from "@/action/alih-status/master/action.read";
import { useDateFormatter } from "@react-aria/i18n";
import { useRouter } from "next/navigation";
import { TableCellStack, TableHeaderStack } from "../_component/tableData";
import { formatRupiah } from "@/lib/number";
export default function PageMasterAlihStatus() {
    const [data, setData] = useState<AlihStatusMasterContract.SelectWithSumDataDTO[]>([]);
    const router = useRouter();

    const [formTarget, setFormTarget] = useState<
        AlihStatusMasterContract.SelectWithSumDataDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const handleDelete = async (id: number) => {
        try {

            const result = await actionDeleteAlihStatusMaster({ id });
            if (!result.success) {
                throw result.error
            }
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("Content berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus content", { description: error.message })
        }

    }
    const getListContent = async () => {
        try {
            const res = await actionGetListAlihStatusMasterWithSumData()
            if (!res.success) {
                throw res.error
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan content", { description: error.message })
        }
    }
    useEffect(() => {
        getListContent();
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end">
                <Button onPress={() => setFormTarget(null)}>
                    Tambah Content
                </Button>
            </div>

            <Table aria-label="Tabel content">
                <Table.ScrollContainer>
                    <Table.Content aria-label="Example table">
                        <TableHeader>
                            <TableColumn isRowHeader >Nama Perangkat Daerah</TableColumn>
                            <TableColumn>Pengguna Barang</TableColumn>
                            <TableColumn>Pengurus Barang</TableColumn>
                            <TableColumn>

                                <TableHeaderStack columns={["Nilai Perolehan", "Jumlah"]} />
                            </TableColumn>

                            <TableColumn>Aksi</TableColumn>
                        </TableHeader>
                        <TableBody
                            items={data}
                        >
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.perangkatDaerahAsal}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{item.penggunaBarangNama}</span>
                                            <span className="text-xs">{item.penggunaBarangNIP}</span>
                                            <span className="text-xs">{item.penggunaBarangPangkat}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.pengurusBarangNama}
                                    </TableCell>
                                    <TableCell>
                                        <TableCellStack columns={[formatRupiah(item.totalNilaiPerolehan), `${item.jumlahBarang} item`]} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onPress={() => router.push(`/dashboard/alih-status/master/${item.id}`)}
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
                <ContentFormModal
                    target={formTarget}
                    onClose={() => { setFormTarget(undefined); getListContent() }}
                />
            )}
        </div>
    );
}
