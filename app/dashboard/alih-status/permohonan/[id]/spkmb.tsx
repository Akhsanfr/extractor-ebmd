"use client";

import { useCallback, useMemo, useState } from "react";
import {
    Chip,
    Select,
    Button,
    Table,
    Label,
    ListBox,
    ButtonGroup,
    Checkbox,
    toast,
    Skeleton,
    Tooltip,
    ButtonGroupSeparator,
} from "@heroui/react";
import { AlihStatusSPKMBContract } from "@/action/alih-status/spkmb/contract";
import { EntityFormModal } from "../../_component/entityFormModal";
import { AutocompleteFormField, SelectFormField, TextFormField } from "../../_component/formField";
import { actionCreateAlihStatusSpkmb } from "@/action/alih-status/spkmb/action.create";
import { actionEditAlihStatusSpkmb } from "@/action/alih-status/spkmb/action.update";
import { Controller } from "react-hook-form";
import { Edit, Plus, Printer, RefreshCw, Trash } from "lucide-react";
import { PegawaiPangkatGolongan } from "@/enum/user";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { actionGetListAlihStatusSpkmbByIds } from "@/action/alih-status/spkmb/action.read";
import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { generateDocument } from "@/lib/generateDoc";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { replaceNullWithDash } from "@/lib/array";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { actionDeleteAlihStatusSpkmb } from "@/action/alih-status/spkmb/action.delete";
import { TableCellStack } from "../../_component/data/tableCellStack";
import { PerangkatDaerah, PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";
import DetailSPKMB from "../../_component/spkmb";
import { generateSPKMB } from "@/lib/generateDoc/alih-status/generateSPKMB";

const features = tableFeatures({})

const columnHelper = createColumnHelper<typeof features, AlihStatusSPKMBContract.SelectDTO>();

export default function AlihStatusSpkmb({ query, queryKey }: { query: UseQueryResult<AlihStatusPermohonanContract.SelectWithDetailDTO>, queryKey: unknown[] }
) {

    const data = useMemo(() => {
        if (!query.data) return []
        return query.data.data
    }, [query.data])

    const [formTarget, setFormTarget] = useState<
        AlihStatusSPKMBContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    // FIX: target yang sedang di-edit harus tetap muncul di opsi,
    // walaupun dia sendiri "sudah punya" SPKMB (yaitu dirinya sendiri).
    // Sebelumnya filter ini membuang semua target yang sudah ada SPKMB-nya
    // tanpa mengecualikan target milik formTarget saat ini, sehingga saat
    // edit, value perangkatDaerahTujuan yang sudah terisi di form tidak
    // ditemukan di daftar options autocomplete.
    const availablePerangkatDaerahTujuan: string[] = useMemo(() => {
        if (!query.data) return []
        const list = new Set(query.data.data.map((item) => item.perangkatDaerahTujuan))
        if (list.size == 0) return []
        const listPerangkatDaerah = Array.from(list)
        return listPerangkatDaerah.filter((item) =>
            item === formTarget?.perangkatDaerahTujuan ||
            !query.data?.spkmb.find((spkmb) => spkmb.perangkatDaerahTujuan === item)
        )
    }, [query.data, formTarget])

    const queryClient = useQueryClient();
    const refresh = useCallback(async () => {
        try {
            if (!query.data) throw new Error("Data belum tersedia")
            const { data } = query.data
            if (!data.length) throw new Error("Data belum tersedia")
            const uniqueSpkmbId = Array.from(new Set(data.map((item) => item.spkmbId))).filter(i => i !== null)
            const res = await actionGetListAlihStatusSpkmbByIds(uniqueSpkmbId);
            if (!res.success) {
                throw res.error
            }
            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    spkmb: res.data,
                };
            })
        } catch (error) {
            toast.danger("Gagal memperbarui data SPKMB", {
                description: (error as Error).message
            })
        }
    }, [query.data, queryClient, queryKey])
    const onSuccessMutation = async (result: unknown) => {
        const parsed = AlihStatusSPKMBContract.select.safeParse(result);

        if (!parsed.success) {
            // fallback: kalau shape-nya nggak sesuai SelectDTO, refetch aja biar aman
            await refresh();
            return;
        }

        const updated = parsed.data;

        queryClient.setQueryData(
            queryKey,
            (old: AlihStatusPermohonanContract.SelectWithDetailDTO) => {
                if (!old) return old;

                const existingIndex = old.spkmb.findIndex(
                    (item) => item.id === updated.id,
                );

                const nextSpkmb =
                    existingIndex === -1
                        ? [...old.spkmb, updated]
                        : old.spkmb.map((item) =>
                            item.id === updated.id ? updated : item,
                        );

                const nextData = old.data.map((item) => {
                    // data yang perangkatDaerahTujuan-nya cocok -> link ke spkmb ini
                    if (item.perangkatDaerahTujuan === updated.perangkatDaerahTujuan) {
                        return item.spkmbId === updated.id
                            ? item
                            : { ...item, spkmbId: updated.id };
                    }
                    // data lama yang sebelumnya terhubung ke spkmb ini tapi
                    // perangkatDaerahTujuan-nya udah nggak match (edit case) -> unlink
                    if (item.spkmbId === updated.id) {
                        return { ...item, spkmbId: null };
                    }
                    return item;
                });

                return { ...old, spkmb: nextSpkmb, data: nextData };
            },
        );
    }

    const removeSpkmb = useCallback(async (spkmbId: number) => {
        try {
            const result = await actionDeleteAlihStatusSpkmb({
                id: spkmbId,
            });

            if (!result.success) {
                throw result.error;
            }

            queryClient.setQueryData(queryKey, (old: AlihStatusPermohonanContract.SelectWithDetailDTO) => {
                if (!old) return old;

                return {
                    ...old,
                    spkmb: old.spkmb.filter(
                        (item) => item.id !== spkmbId,
                    ),
                    data: old.data.map((item) =>
                        item.spkmbId === spkmbId
                            ? { ...item, spkmbId: null }
                            : item,
                    ),
                };
            });

            toast.success("SPKMB berhasil dihapus");
        } catch (error: any) {
            toast.danger("Gagal menghapus SPKMB", error.message);
        }
    }, [queryClient, queryKey]);
    const columns = useMemo(() => columnHelper.columns([
        columnHelper.display({
            id: "no",
            header: "No",
            cell: ({ row }) => row.index + 1,
        }),
        columnHelper.accessor("perangkatDaerahTujuan", {
            header: "Perangkat Daerah Tujuan",
            cell: ({ row }) => (
                <TableCellStack columns={[row.original.perangkatDaerahTujuan]} />
            ),
        }),
        columnHelper.accessor("penggunaBarangTujuanNama", {
            header: "Jabatan",
            cell: ({ row }) => (
                <TableCellStack columns={[row.original.penggunaBarangTujuanNama, row.original.penggunaBarangTujuanNIP, row.original.penggunaBarangTujuanPangkat]} />
            ),
        }),
        columnHelper.accessor("isComplete", {
            header: "Status",
            cell: ({ row }) => (
                <TableCellStack columns={[row.original.isComplete ? <Chip>Lengkap</Chip> : <Chip variant="soft">Belum Lengkap</Chip>]} />
            ),
        }),
        columnHelper.display({
            id: "actions",
            header: "Aksi",
            cell: ({ row }) => (
                <ButtonGroup>
                    <Button variant="outline" size="sm" onPress={() => setFormTarget(row.original)}>
                        <Edit />
                    </Button>
                    <Button variant="outline" size="sm" onPress={() => query.data && generateSPKMB(query.data, row.original.id)}>
                        <Printer />
                    </Button>
                    {
                        !row.original.isComplete ? <Button variant="danger-soft" size="sm" onPress={() => removeSpkmb(row.original.id)}>
                            <Trash />
                        </Button> : null
                    }
                </ButtonGroup>
            ),
        }),
    ]), [query.data, removeSpkmb])
    const table = useTable({
        features,
        columns,
        data: query.data?.spkmb ?? [],
    })
    const rows = table.getRowModel().rows;

    // Default values form SPKMB hanya perlu dihitung ulang saat target/data berubah,
    // bukan setiap render (termasuk saat query refetch di background).
    const spkmbDefaultValues = useMemo(() => ({
        dataIds: data
            .filter((item) => item.spkmbId === formTarget?.id)
            .map((item) => item.id),
        isComplete: formTarget?.isComplete ?? false,
        suratNomor: formTarget?.suratNomor ?? `000.2.3.2/     /     /${new Date().getFullYear()}`,
        suratTanggal: formTarget?.suratTanggal ?? null,
        perangkatDaerahTujuan: formTarget?.perangkatDaerahTujuan ?? "",
        penggunaBarangTujuanNama: formTarget?.penggunaBarangTujuanNama ?? "",
        penggunaBarangTujuanPangkat: formTarget?.penggunaBarangTujuanPangkat ?? "",
        penggunaBarangTujuanNIP: formTarget?.penggunaBarangTujuanNIP ?? "",
    }), [data, formTarget])


    return (
        <>
            <DetailSPKMB data={query.data?.spkmb ?? []} isLoading={query.isLoading} action={
                <ButtonGroup>
                    <Tooltip>
                        <Tooltip.Trigger>
                            <Button variant="secondary" onPress={() => setFormTarget(null)}><Plus /></Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <Tooltip.Arrow />
                            Tambah SPKMB
                        </Tooltip.Content>
                    </Tooltip>
                    {query.data?.spkmb.length === 1 && (
                        <Tooltip>
                            <Tooltip.Trigger>
                                <Button
                                    variant="secondary"
                                    onPress={() => {
                                        const data = query.data;

                                        if (!data) {
                                            toast.danger("Gagal mengedit SPKMB", {
                                                description: "Data belum tersedia",
                                            });
                                            return;
                                        }

                                        setFormTarget(data.spkmb[0]);
                                    }}
                                >
                                    <ButtonGroup.Separator />
                                    <Edit />
                                </Button>
                            </Tooltip.Trigger>

                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                Edit SPKMB
                            </Tooltip.Content>
                        </Tooltip>
                    )}

                    {query.data?.spkmb.length === 1 && (
                        <Tooltip>
                            <Tooltip.Trigger>
                                <Button
                                    variant="secondary"
                                    onPress={() => {
                                        const data = query.data;

                                        if (!data) {
                                            toast.danger("Gagal mencetak draft SPKMB", {
                                                description: "Data belum tersedia",
                                            });
                                            return;
                                        }

                                        generateSPKMB(data, data.spkmb[0].id);
                                    }}
                                >
                                    <ButtonGroup.Separator />
                                    <Printer />
                                </Button>
                            </Tooltip.Trigger>

                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                Cetak Draft SPKMB
                            </Tooltip.Content>
                        </Tooltip>
                    )}
                </ButtonGroup>
            } />
            {formTarget !== undefined && (
                <EntityFormModal<AlihStatusSPKMBContract.CreateDTO>
                    target={formTarget as (AlihStatusSPKMBContract.CreateDTO & { id: number }) | null}
                    defaultValues={spkmbDefaultValues}
                    schema={AlihStatusSPKMBContract.create}
                    createAction={actionCreateAlihStatusSpkmb}
                    editAction={actionEditAlihStatusSpkmb}
                    label="SPKMB"
                    onClose={async () => {
                        setFormTarget(undefined)
                    }}
                    onSuccess={onSuccessMutation}
                >
                    {(form) => (
                        <>
                            <AutocompleteFormField
                                onChange={(value) => {
                                    form.setValue("dataIds", data.filter((item) => item.perangkatDaerahTujuan === value).map((item) => item.id))
                                }}
                                control={form.control}
                                errors={form.formState.errors}
                                name="perangkatDaerahTujuan"
                                label="Tujuan Perangkat Daerah"
                                options={availablePerangkatDaerahTujuan.map((perangkatDaerah) => ({
                                    value: perangkatDaerah,
                                    label: perangkatDaerah,
                                }))}
                            />
                            <TextFormField
                                control={form.control}
                                errors={form.formState.errors}
                                name="suratNomor"
                                label="Nomor Surat"
                            />
                            <TextFormField
                                control={form.control}
                                errors={form.formState.errors}
                                name="suratTanggal"
                                label="Tanggal Surat"
                                type="date"
                            />
                            <Controller
                                name="isComplete"
                                control={form.control}
                                render={({ field }) => (
                                    <Checkbox name={field.name} isSelected={field.value} onChange={field.onChange}>
                                        <Checkbox.Content>
                                            <Checkbox.Control>
                                                <Checkbox.Indicator />
                                            </Checkbox.Control>
                                            Sudah Lengkap
                                        </Checkbox.Content>
                                    </Checkbox>
                                )}
                            />

                            <TextFormField
                                control={form.control}
                                errors={form.formState.errors}
                                name="penggunaBarangTujuanNama"
                                label="Nama Pengguna Barang"
                            />

                            <SelectFormField
                                control={form.control}
                                errors={form.formState.errors}
                                name="penggunaBarangTujuanPangkat"
                                label="Jabatan Pengguna Barang"
                                options={Object.values(PegawaiPangkatGolongan).map((item) => ({
                                    value: item,
                                    label: item,
                                }))}
                                description="Jabatan Pengguna Barang"
                                placeholder="Pilih Jabatan Pengguna Barang"
                            />
                            <TextFormField
                                control={form.control}
                                errors={form.formState.errors}
                                name="penggunaBarangTujuanNIP"
                                label="NIP Pengguna Barang"
                                format="nip"
                            />
                        </>
                    )}
                </EntityFormModal >
            )
            }
        </>
    );
}