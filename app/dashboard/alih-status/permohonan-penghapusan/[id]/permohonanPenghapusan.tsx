import { AlihStatusPermohonanPenghapusanContract } from "@/action/alih-status/permohonan-penghapusan/contract"
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast, Tooltip } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { AutocompleteFormField, SelectFormField, TextFormField } from "../../_component/formField";
import { Delete, Edit, Printer, RefreshCw } from "lucide-react";
import { actionCreateAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.create";
import { actionEditAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.update";
import DetailPermohonanPenghapusan from "../../_component/permohonanPenghapusan";
import { generateDocument } from "@/lib/generateDoc";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { PegawaiPangkatGolongan } from "@/enum/user";
import { generatePermohonanPenghapusan } from "@/lib/generateDoc/alih-status/generatePermohonanPenghapusan";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";
export default function AlihStatusPermohonanPenghapusan({ query, queryKey }: { query: UseQueryResult<AlihStatusPermohonanPenghapusanContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusPermohonanPenghapusanContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusPermohonanPenghapusanContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanPenghapusanContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, permohonanPenghapusan: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const print = useCallback(() => {
        try {
            if (!query.data) throw new Error("Data belum tersedia")
            generatePermohonanPenghapusan(query.data)
        } catch (error: any) {
            toast.danger("Gagal mencetak draft dokumen Permohonan Penghapusan", {
                description: error.message
            });
        }
    }, [query.data]);
    return <>
        <DetailPermohonanPenghapusan data={query.data ? [query.data.permohonanPenghapusan] : []} isLoading={query.isLoading} action={
            <ButtonGroup>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button isDisabled={query.isLoading} variant="secondary" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
                            <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Muat Ulang Permohonan Penghapusan
                    </Tooltip.Content>
                </Tooltip>

                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary" onPress={() => setFormTarget(query.data?.permohonanPenghapusan)}><ButtonGroupSeparator /><Edit /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Edit Permohonan Penghapusan
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary" onPress={print}><ButtonGroupSeparator /><Printer /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Cetak Permohonan Penghapusan
                    </Tooltip.Content>
                </Tooltip>
            </ButtonGroup>} />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusPermohonanPenghapusanContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusPermohonanPenghapusanContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    tahun: formTarget?.tahun ?? 0,
                    dataIds: query.data?.data.map((d) => d.id) ?? [],
                    suratNomor: formTarget?.suratNomor ?? "",
                    suratTanggal: formTarget?.suratTanggal ?? "",
                    suratHal: formTarget?.suratHal ?? "",
                    perangkatDaerahAsal: formTarget?.perangkatDaerahAsal ?? "",
                }}
                fixedValues={{}}
                schema={AlihStatusPermohonanPenghapusanContract.create}
                createAction={actionCreateAlihStatusPermohonanPenghapusan}
                editAction={actionEditAlihStatusPermohonanPenghapusan}
                label="Permohonan Penghapusan"
                onClose={async () => {
                    setFormTarget(undefined);
                }}
                onSuccess={onSuccessMutation}
            >
                {(form) => (
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
                        <TextFormField label="Nomor Surat Permohonan Penghapusan" control={form.control} errors={form.formState.errors} name="suratNomor" />
                        <TextFormField label="Tanggal Surat Permohonan Penghapusan" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                        <TextFormField className="col-span-2" label="Hal Surat Permohonan Penghapusan" control={form.control} errors={form.formState.errors} name="suratHal" />
                        <TextFormField label="Nama Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalNama" />
                        <TextFormField label="NIP Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalNIP" format="nip" />
                        <SelectFormField
                            label="Pangkat Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalPangkat"
                            options={Object.values(PegawaiPangkatGolongan).map((item) => ({
                                value: item,
                                label: item,
                            }))}
                        />
                        <TextFormField label="Jabatan Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalJabatan" />
                    </div>
                )}
            </EntityFormModal>
        )}
    </>
}
