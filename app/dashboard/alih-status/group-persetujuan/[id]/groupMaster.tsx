"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Select,
    Description,
    ListBox,
} from "@heroui/react";
import { Trash } from "lucide-react";
import { AlihStatusGroupPersetujuanMasterContract } from "@/action/alih-status/groupPersetujuanMaster/contract";
import { actionDeleteAlihStatusGroupPersetujuanMasterByMasterId } from "@/action/alih-status/groupPersetujuanMaster/action.delete";
import { actionGetListAlihStatusGroupPersetujuanMaster } from "@/action/alih-status/groupPersetujuanMaster/action.read";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Modal,
    Button,
    toast,
    TextField,
    Label,
    ErrorMessage,
} from "@heroui/react";
import { actionCreateAlihStatusGroupMaster } from "@/action/alih-status/groupPersetujuanMaster/action.create";
import { AlihStatusMasterContract } from "@/action/alih-status/master/contract";
import { actionGetListAlihStatusMaster } from "@/action/alih-status/master/action.read";
import { AlihStatusTabelData, TableCellStack, TableHeaderStack } from "../../_component/tableData";
import { actionGetListMasterWithSumDataByGroupPersetujuan } from "@/action/alih-status/groupPersetujuan/action.read";
import { formatRupiah } from "@/lib/number";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { actionGetListAlihStatusDataByMasterId } from "@/action/alih-status/data/action.read";

// MasterData is a junction table with no update action, so rows can only be
// created or deleted here — there is no Edit button / edit mode.
export default function AlihStatusGroupMaster({ groupId, data, setData }: { groupId: number, data: AlihStatusDataContract.SelectDTO[], setData: (val: AlihStatusDataContract.SelectDTO[]) => void }) {
    const [master, setMaster] = useState<AlihStatusMasterContract.SelectWithSumDataDTO[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleDelete = async (masterId: number) => {
        try {
            const result = await actionDeleteAlihStatusGroupPersetujuanMasterByMasterId({ masterId });
            if (!result.success) {
                throw result.error;
            }
            setMaster((prev) => prev.filter((item) => item.id !== masterId));
            toast.success("Relasi Master-Data Alih Status berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus relasi master-data alih status", { description: error.message });
        }
    };

    const getListData = async () => {
        try {
            const res = await actionGetListMasterWithSumDataByGroupPersetujuan(groupId);
            // console.log("data master", res.data)
            if (!res.success) {
                throw res.error;
            }
            setMaster(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan relasi master-data alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getListData();
    }, []);

    return (
        <>
            <div className="flex justify-end">
                <Button onPress={() => setIsFormOpen(true)}>
                    Tambah Relasi Master-Data Alih Status
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
                            items={master}
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
                                        <Button onClick={() => handleDelete(item.id)}><Trash /></Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table> {
                master.length > 0 &&
                <TabelData masterIds={master.map((m) => m.id)} data={data} setData={setData} />
            }

            {/* <AlihStatusTabelData masterIds={data.map((item) => item.masterId)} /> */}

            {
                isFormOpen && (
                    <MasterDataFormModal
                        groupId={groupId}
                        onClose={() => {
                            setIsFormOpen(false);
                            getListData();
                        }}
                    />
                )
            }
        </>
    );
}


function MasterDataFormModal({
    groupId,
    onClose,
}: {
    groupId: number;
    onClose: () => void;
}) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusGroupPersetujuanMasterContract.CreateDTO>({
        resolver: zodResolver(AlihStatusGroupPersetujuanMasterContract.create),
        defaultValues: {
            groupId,
            masterId: undefined,
        },
    });

    const [availableMaster, setAvailableMaster] = useState<AlihStatusMasterContract.SelectDTO[]>([])

    const getAvailableMaster = async () => {
        try {
            const res = await actionGetListAlihStatusMaster();
            if (!res.success) {
                throw res.error;
            }
            setAvailableMaster(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan master data alih status", { description: error.message });
        }
    }

    useEffect(() => {
        getAvailableMaster();
    }, []);

    const onSubmit = async (values: AlihStatusGroupPersetujuanMasterContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusGroupMaster(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success("Relasi Master-Data Alih Status ditambahkan", { description: result.message });
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan relasi master-data alih status", { description: error.message });
        }
    };
    const onError = (errors: any) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(errors) });
    };

    return (
        <Modal isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
                            <Modal.CloseTrigger onPress={onClose} />
                            <Modal.Header>
                                <Modal.Heading>
                                    Tambah Relasi Master-Data Alih Status
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4">
                                <Controller
                                    name="masterId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Select {...field}>
                                                <Label />
                                                <Select.Trigger>
                                                    <Select.Value />
                                                    <Select.Indicator />
                                                </Select.Trigger>
                                                <Description />
                                                <Select.Popover>
                                                    <ListBox>
                                                        {availableMaster.map((item) => (
                                                            <ListBox.Item key={item.id} id={item.id}>
                                                                <Label>{item.perangkatDaerahAsal}</Label>
                                                                <Description />
                                                                <ListBox.ItemIndicator />
                                                            </ListBox.Item>
                                                        ))}
                                                    </ListBox>
                                                </Select.Popover>
                                            </Select>
                                            <ErrorMessage>{Boolean(errors.masterId) && <>{errors.masterId?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onPress={onClose}>
                                    Batal
                                </Button>
                                <Button type="submit">
                                    Simpan
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
function TabelData({ data, setData, masterIds }: {
    data: AlihStatusDataContract.SelectDTO[],
    setData: (val: AlihStatusDataContract.SelectDTO[]) => void,
    masterIds: number[]
}) {
    const getListData = async () => {
        try {
            const res = await actionGetListAlihStatusDataByMasterId(masterIds)
            console.log("hasil res data", masterIds, res.success)
            if (!res.success) throw res.error
            setData(res.data)
        } catch (error: any) {
            toast.danger("Gagal mengunduh data alih status. " + error.message)
        }
    }
    useEffect(() => { getListData() }, [])
    return <AlihStatusTabelData data={data} />
}