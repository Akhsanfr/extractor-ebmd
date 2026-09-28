"use client";
import { useMemo, useState } from "react";
import {
    Button,
    Label,
    Modal,
    Skeleton,
    Table,
    toast,
    Select,
    ListBox,
    useOverlayState,
    ButtonGroup,
    ButtonGroupSeparator,
} from "@heroui/react";
import { useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { Edit, Import, Plus, Trash } from "lucide-react";
import { actionCreateAlihStatusData, actionImportAlihStatusData } from "@/action/alih-status/data/action.create";
import { actionEditAlihStatusData } from "@/action/alih-status/data/action.update";
// NOTE: mengikuti pola action.delete.ts pada modul spkmb (actionDeleteAlihStatusSpkmb).
// Sesuaikan path/nama import ini kalau berbeda di modul "data".
import { actionDeleteAlihStatusData } from "@/action/alih-status/data/action.delete";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { AlihStatusDataFormat } from "@/action/alih-status/data/format";
import ImportExcel from "@/component/import";
import { AlihStatusTabelData } from "../../_component/data/tableData";
import { EntityFormModal } from "../../_component/entityFormModal";
import { AutocompleteFormField, NumberFormField, SelectFormField, TextFormField } from "../../_component/formField";
import { Controller } from "react-hook-form";
import { BmdAssetType, BmdAssetTypeLabel } from "@/enum/bmd";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";
import Loading from "@/component/loading";
import Decimal from "decimal.js";

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan"): string {
    return error instanceof Error ? error.message : fallback;
}

export default function AlihStatusData({
    permohonanId,
    query,
    queryKey,
}: {
    permohonanId: number;
    query: UseQueryResult<AlihStatusPermohonanContract.SelectWithDetailDTO>;
    queryKey: unknown[];
}) {
    const queryClient = useQueryClient();

    // Sumber data tunggal: list "data BMD" diambil dari query detail permohonan yang sama
    // dipakai oleh AlihStatusPermohonan & AlihStatusSpkmb. Tidak fetch terpisah lagi.
    const data = useMemo(() => query.data?.data ?? [], [query.data]);

    const [formTarget, setFormTarget] = useState
        <AlihStatusDataContract.SelectDTO | null | undefined>(undefined);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    const onSuccessMutation = async (result: unknown) => {
        try {
            const parsed = AlihStatusDataContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    const existingIndex = old.data.findIndex((item) => item.id === parsed.id);
                    const nextData =
                        existingIndex === -1
                            ? [...old.data, parsed]
                            : old.data.map((item) => (item.id === parsed.id ? parsed : item));

                    return { ...old, data: nextData };
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message });
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            const result = await actionDeleteAlihStatusData({ id });
            if (!result.success) throw result.error;

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanContract.SelectWithDetailDTO) => {
                    if (!old) return old;
                    return { ...old, data: old.data.filter((item) => item.id !== id) };
                },
            );

            toast.success("Data Alih Status berhasil dihapus");
        } catch (error) {
            toast.danger("Gagal menghapus data alih status", {
                description: getErrorMessage(error),
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <Label>Data BMD Alih Status</Label>
                <ButtonGroup>
                    <DataImportModal permohonanId={permohonanId} queryKey={queryKey} />
                    <Button variant="secondary" onPress={() => setFormTarget(null)}>
                        <ButtonGroupSeparator />
                        <Plus />
                    </Button>
                </ButtonGroup>
            </div>

            <AlihStatusTabelData
                isLoading={query.isLoading}
                data={data}
                bodyAction={(e) => {
                    const { item } = e;
                    const isDeletingThis = deletingId === item.id;
                    return (
                        <Table.Cell>
                            <Button size="sm" onPress={() => setFormTarget(item)}>
                                <Edit />
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                isDisabled={isDeletingThis}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Trash />
                            </Button>
                        </Table.Cell>
                    );
                }}
                headerAction={<Table.Column className="flex gap-2">Aksi</Table.Column>}
            />

            {formTarget !== undefined && (
                <EntityFormModal<AlihStatusDataContract.CreateDTO>
                    target={formTarget as (AlihStatusDataContract.CreateDTO & { id: number }) | null}
                    defaultValues={{
                        permohonanId,
                        assetType: formTarget?.assetType ?? BmdAssetType.TANAH,
                        kodeBarang: formTarget?.kodeBarang ?? "",
                        kodeRegister: formTarget?.kodeRegister ?? "",
                        namaBarangKategori: formTarget?.namaBarangKategori ?? "",
                        merkTipe: formTarget?.merkTipe ?? "",
                        nomorPolisi: formTarget?.nomorPolisi ?? "",
                        nomorRangka: formTarget?.nomorRangka ?? "",
                        nomorMesin: formTarget?.nomorMesin ?? "",
                        kondisi: formTarget?.kondisi ?? "",
                        lokasi: formTarget?.lokasi ?? "",
                        tahun: formTarget?.tahun ?? 0,
                        asalUsul: formTarget?.asalUsul ?? "",
                        jumlah: formTarget?.jumlah ?? undefined,
                        nilaiPerolehan: formTarget?.nilaiPerolehan ?? "0",
                        akumulasiPenyusutan: formTarget?.akumulasiPenyusutan ?? "0",
                        nilaiBuku: formTarget?.nilaiBuku ?? "0",
                        perangkatDaerahTujuan: formTarget?.perangkatDaerahTujuan ?? "",
                    }}
                    fixedValues={{ permohonanId }}
                    schema={AlihStatusDataContract.create}
                    createAction={actionCreateAlihStatusData}
                    editAction={actionEditAlihStatusData}
                    label="Data Master"
                    containerSize="lg"
                    bodyClassName="grid grid-cols-12 gap-2"
                    onClose={async () => {
                        setFormTarget(undefined);
                    }}
                    onSuccess={onSuccessMutation}
                >
                    {(form) => (
                        <>
                            <TextFormField className="col-span-12" control={form.control} errors={form.formState.errors} name="nibar" label="NIBAR" />
                            <TextFormField className="col-span-12" control={form.control} errors={form.formState.errors} name="kodeRegister" label="Kode Register" />
                            <TextFormField className="col-span-6" control={form.control} errors={form.formState.errors} name="kodeBarang" label="Kode Barang" />
                            <TextFormField className="col-span-6" control={form.control} errors={form.formState.errors} name="namaBarangKategori" label="Nama / Kategori Barang" />
                            <TextFormField className="col-span-12" control={form.control} errors={form.formState.errors} name="merkTipe" label="Merk / Tipe" />
                            <TextFormField className="col-span-3" format="nopol" control={form.control} errors={form.formState.errors} name="nomorPolisi" label="Nomor Polisi" />
                            <TextFormField className="col-span-5" control={form.control} errors={form.formState.errors} name="nomorRangka" label="Nomor Rangka" />
                            <TextFormField className="col-span-4" control={form.control} errors={form.formState.errors} name="nomorMesin" label="Nomor Mesin" />
                            <TextFormField className="col-span-2" control={form.control} errors={form.formState.errors} name="tahun" label="Tahun" />
                            <TextFormField className="col-span-4" control={form.control} errors={form.formState.errors} name="asalUsul" label="Asal Usul" />
                            <NumberFormField className="col-span-2" control={form.control} errors={form.formState.errors} name="jumlah" label="Jumlah" />
                            <NumberFormField className="col-span-4" control={form.control} errors={form.formState.errors} name="luas" label="Luas" />
                            <NumberFormField
                                className="col-span-4"
                                control={form.control}
                                errors={form.formState.errors}
                                name="nilaiPerolehan"
                                label="Nilai Perolehan"
                                onChange={(v) => {
                                    const perolehan = new Decimal(v ?? 0);
                                    const penyusutan = new Decimal(form.getValues("akumulasiPenyusutan") || 0);
                                    const nilaiBuku = perolehan.minus(penyusutan);
                                    form.setValue("nilaiBuku", nilaiBuku.toString(), { shouldValidate: true });
                                }}
                            />

                            <NumberFormField
                                className="col-span-4"
                                control={form.control}
                                errors={form.formState.errors}
                                name="akumulasiPenyusutan"
                                label="Akumulasi Penyusutan"
                                onChange={(v) => {
                                    const penyusutan = new Decimal(v ?? 0);
                                    const perolehan = new Decimal(form.getValues("nilaiPerolehan") || 0);
                                    const nilaiBuku = perolehan.minus(penyusutan);
                                    form.setValue("nilaiBuku", nilaiBuku.toString(), { shouldValidate: true });
                                }}
                            />

                            <NumberFormField
                                className="col-span-4"
                                control={form.control}
                                errors={form.formState.errors}
                                name="nilaiBuku"
                                label="Nilai Buku"
                                readOnly
                                placeholder="Otomatis terhitung"
                            />
                            <SelectFormField options={["Baik", "Rusak Ringan", "Rusak Berat"].map((k) => ({
                                label: k,
                                value: k,
                            }))}
                                className="col-span-5"
                                control={form.control} errors={form.formState.errors} name="kondisi" label="Kondisi" />

                            <TextFormField className="col-span-7" control={form.control} errors={form.formState.errors} name="lokasi" label="Lokasi" />
                            <AutocompleteFormField className="col-span-6" control={form.control} errors={form.formState.errors} name="perangkatDaerahAsal" label="Perangkat Daerah Asal"
                                options={Object.values(PerangkatDaerah).map((item) => ({
                                    value: item,
                                    label: item,
                                }))} />
                            <AutocompleteFormField className="col-span-6" control={form.control} errors={form.formState.errors} name="perangkatDaerahTujuan" label="Perangkat Daerah Tujuan"
                                options={Object.values(PerangkatDaerah).map((item) => ({
                                    value: item,
                                    label: item,
                                }))} />
                            <Controller
                                name="assetType"
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        className="col-span-12"
                                        defaultValue={field.value}
                                        onChange={(key) => field.onChange(key)}
                                    >
                                        <Label>Jenis BMD</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                {Object.values(BmdAssetType).map((item) => (
                                                    <ListBox.Item key={item} id={item}>
                                                        <Label>{BmdAssetTypeLabel[item]}</Label>
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                ))}
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                )}
                            />
                        </>
                    )}
                </EntityFormModal >
            )
            }
        </>
    );
}

function DataImportModal({ permohonanId, queryKey }: { permohonanId: number; queryKey: unknown[] }) {
    const queryClient = useQueryClient();
    const modal = useOverlayState();
    const [previewData, setPreviewData] = useState<AlihStatusDataContract.ImportItemDTO>([]);
    const [file, setFile] = useState<File | null>(null);
    const importMutation = useMutation({
        mutationFn: async () => {
            if (!file) {
                throw new Error("Berkas belum dipilih");
            }
            return await actionImportAlihStatusData({
                data: file,
                permohonanId
            });
        },
        onSuccess: async (res) => {
            if (!res.success) throw res.error
            toast.success(`${previewData.length} baris berhasil diimport`);
            // Import bisa insert banyak baris sekaligus — lebih aman refetch
            // query utama daripada mencoba merge manual ke cache.
            await queryClient.invalidateQueries({ queryKey });
            handleModalOpenChange(false);
        },
        onError: (error: any) => {
            toast.danger("Gagal import" + error.message);
        },
    })


    const resetImportState = () => {
        setPreviewData([]);
        setFile(null);
    };

    const handleModalOpenChange = (open: boolean) => {
        modal.setOpen(open);
        if (!open) resetImportState();
    };

    // Hanya render maksimal PREVIEW_LIMIT baris ke tabel preview, sesuai label
    // "Preview (20 dari X baris)" — sebelumnya seluruh baris ikut dirender
    // walau sudah ribuan baris, yang bisa bikin UI freeze saat import besar.
    const visiblePreviewRows = previewData.map((item, key) => ({
        ...item,
        id: key,
        permohonanId: key,
        perangkatDaerahAsal: "",
        masterId: 0,
    }));

    return (
        <>
            <Button variant="secondary" onPress={() => handleModalOpenChange(true)}><Import /></Button>
            <Modal isOpen={modal.isOpen} onOpenChange={handleModalOpenChange}>
                <Modal.Backdrop>
                    <Modal.Container size={previewData.length > 0 ? "cover" : "sm"}>
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>Import data</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="flex flex-col gap-4">
                                    {previewData.length === 0 ? (
                                        <div className="flex flex-col gap-1">
                                            <Label>File Excel</Label>
                                            <ImportExcel
                                                validation={AlihStatusDataContract.importItem}
                                                format={AlihStatusDataFormat.import}
                                                onSuccess={(rows, importedFile) => {
                                                    setPreviewData(rows);
                                                    setFile(importedFile);
                                                    toast.success(`${rows.length} baris siap diimport`);
                                                }}
                                                sheetName="Alih Status"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <Label>
                                                Preview
                                                {previewData.length} baris
                                            </Label>
                                            <AlihStatusTabelData isLoading={false} data={visiblePreviewRows} />
                                        </div>
                                    )}
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="ghost" onPress={() => handleModalOpenChange(false)}>
                                    Batal
                                </Button>
                                {previewData.length > 0 && (
                                    <Button variant="ghost" onPress={resetImportState}>
                                        Ulangi
                                    </Button>
                                )}
                                <Button
                                    isDisabled={importMutation.isPending || previewData.length === 0}
                                    onPress={() => importMutation.mutateAsync()}
                                >
                                    {importMutation.isPending ? "Menyimpan..." : "Simpan"}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}