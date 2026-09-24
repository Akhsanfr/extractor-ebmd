import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract"
import { Description } from "@/component/description";
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast, Tooltip } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { Edit, Pencil, Printer, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { actionCreateAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.create";
import { actionEditAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.update";
import { SelectFormField, TextFormField } from "../../_component/formField";
import { AlihStatusType } from "@/enum/alihStatus";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { PegawaiPangkatGolongan } from "@/enum/user";
import DetailPermohonan from "../../_component/permohonan";
import { generateDocument } from "@/lib/generateDoc";
import { generatePermohonan } from "@/lib/generateDoc/alih-status/generatePermohonan";
export default function AlihStatusPermohonan({ query, queryKey }: { query: UseQueryResult<AlihStatusPermohonanContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const tahun = useStore($year)
    const [formTarget, setFormTarget] = useState<
        AlihStatusPermohonanContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusPermohonanContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, permohonan: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const print = useCallback(() => {
        try {
            if (!query.data) throw new Error("Data belum tersedia")
            generatePermohonan(query.data)
        } catch (error: any) {
            toast.danger("Gagal mencetak dokumen SPKMB", {
                description: error.message
            });
        }
    }, [query.data]);
    return <>
        <DetailPermohonan data={query.data?.permohonan ? [query.data.permohonan] : []} isLoading={query.isLoading} action={
            <ButtonGroup>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button isDisabled={query.isLoading} variant="secondary" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
                            <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Muat Ulang Permohonan
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary" onPress={() => setFormTarget(query.data?.permohonan)}><Edit /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Edit Permohonan
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary" onPress={print}><ButtonGroupSeparator /><Printer /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Cetak Permohonan
                    </Tooltip.Content>
                </Tooltip>
            </ButtonGroup>
        } />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusPermohonanContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusPermohonanContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    alihStatusType: formTarget?.alihStatusType ?? AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN,
                    suratHal: formTarget?.suratHal ?? "",
                    perangkatDaerahAsal: formTarget?.perangkatDaerahAsal ?? "",
                    suratNomor: formTarget?.suratNomor ?? "",
                    suratTanggal: formTarget?.suratTanggal ?? "",
                    alasan: formTarget?.alasan ?? "",
                    tahun: formTarget?.tahun ?? Number(tahun) ?? new Date().getFullYear(),
                }}
                fixedValues={{}}
                schema={AlihStatusPermohonanContract.create}
                createAction={actionCreateAlihStatusPermohonan}
                editAction={actionEditAlihStatusPermohonan}
                label="Group Alih Status"
                formatValue={(data) => {
                    return {
                        ...data,
                        suratTanggal: data.suratTanggal === "" ? null : data.suratTanggal
                    }
                }}
                onSuccess={onSuccessMutation}
                onClose={async () => {
                    setFormTarget(undefined);
                }}
            >
                {(form) => (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <TextFormField
                                className="col-span-2"
                                control={form.control}
                                errors={form.formState.errors}
                                name="perangkatDaerahAsal"
                                label="Asal Perangkat Daerah"
                            />
                            <SelectFormField
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
                            <TextFormField
                                control={form.control}
                                errors={form.formState.errors}
                                name="penggunaBarangAsalJabatan"
                                label="Jabatan Pengguna Barang"
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
    </>
}
