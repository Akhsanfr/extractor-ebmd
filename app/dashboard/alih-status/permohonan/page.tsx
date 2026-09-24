"use client";

import { useState } from "react";
import {
    Button,
    toast,
    ButtonGroup,
    ButtonGroupSeparator,
} from "@heroui/react";
import { Edit, Eye, Plus, RefreshCw, Trash } from "lucide-react";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { actionDeleteAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.delete";
import { actionGetListAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.read";
import { actionCreateAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.create";
import { actionEditAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.update";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EntityFormModal } from "../_component/entityFormModal";
import { AutocompleteFormField, SelectFormField, TextFormField } from "../_component/formField";
import { AlihStatusType } from "@/enum/alihStatus";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { TableCellStack } from "../_component/data/tableCellStack";
import { PegawaiPangkatGolongan } from "@/enum/user";
import DetailPermohonan from "../_component/permohonan";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";

export default function PageGroupAlihStatus() {
    const tahun = useStore($year);
    const queryKey = ["alih-status", "permohonan", tahun];
    const router = useRouter();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih")
            const res = await actionGetListAlihStatusPermohonan(Number(tahun));
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const [formTarget, setFormTarget] = useState<
        AlihStatusPermohonanContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusPermohonan({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("Permohonan alih status berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanContract.SelectDTO[]) => {
                    if (!old) return old;

                    return old.filter(d => d.id !== id)
                },
            );
        } catch (error: any) {
            toast.danger("Gagal permohonan alih status", { description: error.message });
        }
    };
    const refresh = () => {
        queryClient.refetchQueries({ queryKey })
    }

    return (
        <div className="flex flex-col gap-3">
            <DetailPermohonan
                action={
                    <ButtonGroup>
                        <Button variant="outline" isPending={query.isRefetching} onPress={refresh}>
                            <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                        </Button>
                        <Button variant="outline" onPress={() => { setFormTarget(null) }}>
                            <ButtonGroupSeparator />
                            <Plus />
                        </Button>
                    </ButtonGroup>}
                data={query.data ?? []} isLoading={query.isLoading} shouldTable={true} rowAction={(row) =>
                    <ButtonGroup>
                        <Button
                            variant="secondary" size='sm'
                            onPress={() =>
                                router.push(
                                    `/dashboard/alih-status/permohonan/${row.id}`
                                )
                            }
                        >
                            <Eye />
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onPress={() => handleDelete(row.id)}
                        >
                            <ButtonGroupSeparator />
                            <Trash />
                        </Button>
                    </ButtonGroup>
                }
            />

            {formTarget !== undefined && (
                <EntityFormModal<AlihStatusPermohonanContract.CreateDTO>
                    target={
                        formTarget as
                        | (AlihStatusPermohonanContract.CreateDTO & { id: number })
                        | null
                    }
                    defaultValues={{
                        perangkatDaerahAsal: formTarget?.perangkatDaerahAsal ?? "",
                        alihStatusType: formTarget?.alihStatusType ?? AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN,
                        suratHal: formTarget?.suratHal ?? "Permohonan Pengalihan Status Penggunaan Barang Milik Daerah",
                        suratTanggal: formTarget?.suratTanggal ?? "",
                        suratNomor: formTarget?.suratNomor ?? `000.2.3.2/     /     /${new Date().getFullYear()}`,
                        alasan: formTarget?.alasan ?? "",
                        tahun: formTarget?.tahun ?? Number(tahun) ?? new Date().getFullYear(),
                    }}
                    fixedValues={{}}
                    schema={AlihStatusPermohonanContract.create}
                    createAction={actionCreateAlihStatusPermohonan}
                    editAction={actionEditAlihStatusPermohonan}
                    label="Permohonan Alih Status"
                    formatValue={(data) => {
                        return {
                            ...data,
                            suratTanggal: data.suratTanggal === "" ? null : data.suratTanggal
                        }
                    }}
                    onClose={async () => {
                        setFormTarget(undefined);
                    }}
                    onSuccess={async (data) => {
                        queryClient.setQueryData(
                            queryKey,
                            (old: AlihStatusPermohonanContract.SelectDTO[]) => {
                                if (!old) return old;

                                return [...old, data]
                            },
                        );
                    }}
                >
                    {(form) => (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <AutocompleteFormField
                                    className="col-span-2"
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="perangkatDaerahAsal"
                                    label="Asal Perangkat Daerah"
                                    options={PerangkatDaerah.map((perangkatDaerah) => ({
                                        value: perangkatDaerah,
                                        label: perangkatDaerah,
                                    }))}
                                />
                                <SelectFormField
                                    className="col-span-2"
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="alihStatusType"
                                    label="Jenis Alih Status"
                                    options={Object.values(AlihStatusType).map((item) => ({
                                        value: item,
                                        label: item,
                                    }))}
                                    description="Jenis Alih Status"
                                    placeholder="Pilih jenis alih status"
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
                                <TextFormField
                                    className="col-span-2"
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="suratHal"
                                    label="Hal Surat"
                                />
                                <TextFormField
                                    className="col-span-2"
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="alasan"
                                    label="Alasan"
                                />
                                <TextFormField
                                    className="col-span-2"
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="penggunaBarangAsalNama"
                                    label="Nama Pengguna Barang"
                                />
                                <TextFormField
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="penggunaBarangAsalNIP"
                                    label="NIP Pengguna Barang"
                                    format="nip"
                                />
                                <SelectFormField
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="penggunaBarangAsalPangkat"
                                    label="Pangkat Pengguna Barang"
                                    options={
                                        Object.entries(PegawaiPangkatGolongan).map(([key, value]) => ({ label: value, value: value }))
                                    }
                                />
                            </div>
                        </>
                    )}
                </EntityFormModal>
            )}
        </div>
    );
}