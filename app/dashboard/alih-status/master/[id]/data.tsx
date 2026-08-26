import { actionCreateAlihStatusData, actionImportAlihStatusData } from "@/action/alih-status/data/action.create";
import { actionDeleteAlihStatusData } from "@/action/alih-status/data/action.delete";
import { actionGetListAlihStatusDataByMasterId } from "@/action/alih-status/data/action.read";
import { actionEditAlihStatusData } from "@/action/alih-status/data/action.update";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { AlihStatusDataFormat } from "@/action/alih-status/data/format";
import ImportExcel from "@/component/import";
import { Button, ErrorMessage, Input, Label, Modal, Table, TextField, toast, useOverlayState } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AlihStatusTabelData } from "../../_component/tableData";

export default function AlihStatusData({ masterId }: { masterId: number }) {
    const [loadingData, setLoadingData] = useState(true);
    const [data, setData] = useState<AlihStatusDataContract.SelectDTO[]>([]);

    const [formTarget, setFormTarget] = useState<
        AlihStatusDataContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit


    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusData({ id });
            if (!result.success) {
                throw result.error;
            }
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("Data Alih Status berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus data alih status", { description: error.message });
        }
    };

    const getListData = async () => {
        try {
            setLoadingData(true);
            const res = await actionGetListAlihStatusDataByMasterId([masterId]);
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan data alih status", { description: error.message });
        } finally {
            setLoadingData(false)
        }
    };

    useEffect(() => {
        getListData();
    }, [masterId]);

    return <>
        <div className="flex justify-end">
            <DataImportModal masterId={masterId} onSuccess={getListData} />
            <Button onPress={() => setFormTarget(null)}>
                Tambah Data BMD
            </Button>
        </div>
        <AlihStatusTabelData data={data}
            bodyAction={(e) => {
                const { item } = e
                return <>
                    <Table.Cell>
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
                    </Table.Cell>
                </>
            }}
            headerAction={<Table.Column className="flex gap-2">
                Aksi
            </Table.Column>} />

        {formTarget !== undefined && (
            <DataFormModal
                masterId={masterId}
                target={formTarget}
                onClose={() => {
                    setFormTarget(undefined);
                    getListData();
                }}
            />
        )}
    </>
}



function DataFormModal({
    masterId,
    target,
    onClose,
}: {
    masterId: number;
    target: AlihStatusDataContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusDataContract.CreateDTO>({
        resolver: zodResolver(AlihStatusDataContract.create),
        defaultValues: {
            masterId: masterId,
            kodeBarang: target?.kodeBarang ?? "",
            kodeRegister: target?.kodeRegister ?? "",
            namaBarangKategori: target?.namaBarangKategori ?? "",
            merkTipe: target?.merkTipe ?? "",
            nomorPolisi: target?.nomorPolisi ?? "",
            nomorRangka: target?.nomorRangka ?? "",
            nomorMesin: target?.nomorMesin ?? "",
            kondisi: target?.kondisi ?? "",
            lokasi: target?.lokasi ?? "",
            tahun: target?.tahun ?? undefined,
            asalUsul: target?.asalUsul ?? "",
            jumlah: target?.jumlah ?? undefined,
            nilaiPerolehan: target?.nilaiPerolehan ?? undefined,
            akumulasiPenyusutan: target?.akumulasiPenyusutan ?? undefined,
            nilaiBuku: target?.nilaiBuku ?? undefined,
            perangkatDaerahTujuan: target?.perangkatDaerahTujuan ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusDataContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusData({ id: target!.id, ...values })
                : await actionCreateAlihStatusData(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "Data Alih Status diperbarui" : "Data Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan data alih status", { description: error.message });
        }
    };
    const onError = (errors: any) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(errors) });
    };

    return (
        <Modal isOpen onOpenChange={(open) => !open && onClose()} >
            <Modal.Backdrop>
                <Modal.Container size="lg">
                    <Modal.Dialog >
                        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
                            <Modal.CloseTrigger onPress={onClose} />
                            <Modal.Header>
                                <Modal.Heading>
                                    {isEdit ? "Edit Data Alih Status" : "Tambah Data Alih Status"}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="grid grid-cols-12 gap-2">
                                <Controller

                                    name="kodeBarang"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-6">
                                            <Label>Kode Barang</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.kodeBarang) && <>{errors.kodeBarang?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="kodeRegister"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-6">
                                            <Label>Kode Register</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.kodeRegister) && <>{errors.kodeRegister?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="namaBarangKategori"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-6">
                                            <Label>Nama / Kategori Barang</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.namaBarangKategori) && <>{errors.namaBarangKategori?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="merkTipe"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-6">
                                            <Label>Merk / Tipe</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.merkTipe) && <>{errors.merkTipe?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="nomorPolisi"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-4">
                                            <Label>Nomor Polisi</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.nomorPolisi) && <>{errors.nomorPolisi?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="nomorRangka"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-4">
                                            <Label>Nomor Rangka</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.nomorRangka) && <>{errors.nomorRangka?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="nomorMesin"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-4">
                                            <Label>Nomor Mesin</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.nomorMesin) && <>{errors.nomorMesin?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="kondisi"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-3">
                                            <Label>Kondisi</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.kondisi) && <>{errors.kondisi?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />

                                <Controller
                                    name="tahun"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-3">
                                            <Label>Tahun</Label>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.tahun) && <>{errors.tahun?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="asalUsul"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-3">
                                            <Label>Asal Usul</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.asalUsul) && <>{errors.asalUsul?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="jumlah"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-3">
                                            <Label>Jumlah</Label>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.jumlah) && <>{errors.jumlah?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="nilaiPerolehan"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-4">
                                            <Label>Nilai Perolehan</Label>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.nilaiPerolehan) && <>{errors.nilaiPerolehan?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="akumulasiPenyusutan"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-4">
                                            <Label>Akumulasi Penyusutan</Label>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.akumulasiPenyusutan) && <>{errors.akumulasiPenyusutan?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="nilaiBuku"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-4">
                                            <Label>Nilai Buku</Label>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.nilaiBuku) && <>{errors.nilaiBuku?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="lokasi"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-7">
                                            <Label>Lokasi</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.lokasi) && <>{errors.lokasi?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="perangkatDaerahTujuan"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-5">
                                            <Label>Perangkat Daerah Tujuan</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.perangkatDaerahTujuan) && <>{errors.perangkatDaerahTujuan?.message}</>}
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

const PREVIEW_LIMIT = 20;
function DataImportModal({ masterId, onSuccess }: { masterId: number, onSuccess: () => void }) {
    const modal = useOverlayState();
    const [previewData, setPreviewData] = useState<AlihStatusDataContract.ImportItemDTO>([]);
    const [file, setFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const resetImportState = () => {
        setPreviewData([]);
    };
    const handleModalOpenChange = (open: boolean) => {
        modal.setOpen(open);
        if (!open) resetImportState();
    };
    const submit = async () => {

        if (previewData.length === 0) {
            toast.danger("Gagal import", { description: "Belum ada data Excel yang diimport" });
            return;
        }
        if (!file) {
            toast.danger("Gagal import", { description: "File Excel tidak ada" });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await actionImportAlihStatusData({
                data: file,
                masterId: masterId,
            });
            if (!res.success) throw res.error;
            toast.success(`${previewData.length} baris berhasil diimport`);
            handleModalOpenChange(false);
            onSuccess()
        } catch (error: any) {
            toast.danger("Gagal import", { description: error?.message ?? "Terjadi kesalahan" });
        } finally {
            setIsSubmitting(false);
        }
    };
    return <>
        <Button onPress={() => handleModalOpenChange(true)}>Tambah</Button>
        <Modal isOpen={modal.isOpen} onOpenChange={handleModalOpenChange}>
            <Modal.Backdrop>
                <Modal.Container size={previewData.length > 0 ? "cover" : "sm"}>
                    <Modal.Dialog>
                        <Modal.Header>
                            <Modal.Heading>Import data</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-4">

                                {/* 2. Import excel */}
                                {previewData.length === 0 ?
                                    <div className="flex flex-col gap-1">
                                        <Label >File Excel</Label>
                                        <ImportExcel
                                            validation={AlihStatusDataContract.importItem}
                                            format={AlihStatusDataFormat.import}
                                            onSuccess={(rows, file) => {
                                                setPreviewData(rows);
                                                setFile(file);
                                                toast.success(`${rows.length} baris siap diimport`);
                                            }}
                                            sheetName="Sheet1"
                                        />
                                    </div>
                                    : (
                                        <div className="flex flex-col gap-1">
                                            <Label>
                                                Preview ({Math.min(previewData.length, PREVIEW_LIMIT)} dari{" "}
                                                {previewData.length} baris)
                                            </Label>
                                            <AlihStatusTabelData data={previewData.map((item, key) => ({ ...item, id: key, masterId: key, perangkatDaerahAsal: "" }))} />
                                        </div>
                                    )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" onPress={() => handleModalOpenChange(false)}>
                                Batal
                            </Button>
                            {previewData.length > 0 && (
                                <Button variant="ghost" onPress={() => { setPreviewData([]); setFile(null) }}>
                                    Ulangi
                                </Button>
                            )}
                            <Button
                                isDisabled={
                                    isSubmitting || previewData.length === 0
                                }
                                onPress={submit}
                            >
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    </>
}
