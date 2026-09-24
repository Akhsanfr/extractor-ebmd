import { AlihStatusBASTContract } from "@/action/alih-status/bast/contract"
import { Description } from "@/component/description";
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast, Tooltip } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { SelectFormField, TextFormField } from "../../_component/formField";
import { AlihStatusType } from "@/enum/alihStatus";
import { Delete, Edit, Printer, RefreshCw } from "lucide-react";
import DetailBAST from "../../_component/bast";
import { actionCreateAlihStatusBAST } from "@/action/alih-status/bast/action.create";
import { actionEditAlihStatusBAST } from "@/action/alih-status/bast/action.update";
import { PegawaiPangkatGolongan } from "@/enum/user";
import { generateBAST } from "@/lib/generateDoc/alih-status/generateBAST";
export default function AlihStatusBAST({ query, queryKey }: { query: UseQueryResult<AlihStatusBASTContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusBASTContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusBASTContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusBASTContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, bast: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const print = useCallback(() => {
        try {
            if (!query.data) throw new Error("Data belum tersedia")
            generateBAST(query.data)
        } catch (error: any) {
            toast.danger("Gagal mencetak draft dokumen BAST", {
                description: error.message
            });
        }
    }, [query.data]);
    return <>
        <DetailBAST data={query.data ? [query.data.bast] : []} isLoading={query.isLoading} action={
            <ButtonGroup>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button isDisabled={query.isLoading} variant="secondary" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
                            <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Muat Ulang BA Penelitian
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary" onPress={() => setFormTarget(query.data?.bast)}><ButtonGroupSeparator /><Edit /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Edit BA Penelitian
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary" onPress={print}><ButtonGroupSeparator /><Printer /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Cetak BA Penelitian
                    </Tooltip.Content>
                </Tooltip>
            </ButtonGroup>} />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusBASTContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusBASTContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    tahun: formTarget?.tahun ?? 0,
                    dataIds: query.data?.data.map((d) => d.id) ?? [],

                    suratNomor: formTarget?.suratNomor ?? "",
                    suratTanggal: formTarget?.suratTanggal ?? "",

                    perangkatDaerahAsal: formTarget?.perangkatDaerahAsal ?? "",
                    penggunaBarangAsalNama: formTarget?.penggunaBarangAsalNama ?? "",
                    penggunaBarangAsalNIP: formTarget?.penggunaBarangAsalNIP ?? "",
                    penggunaBarangAsalPangkat: formTarget?.penggunaBarangAsalPangkat ?? "",
                    penggunaBarangAsalJabatan: formTarget?.penggunaBarangAsalJabatan ?? "",

                    perangkatDaerahTujuan: formTarget?.perangkatDaerahTujuan ?? "",
                    penggunaBarangTujuanNama: formTarget?.penggunaBarangTujuanNama ?? "",
                    penggunaBarangTujuanNIP: formTarget?.penggunaBarangTujuanNIP ?? "",
                    penggunaBarangTujuanPangkat: formTarget?.penggunaBarangTujuanPangkat ?? "",
                    penggunaBarangTujuanJabatan: formTarget?.penggunaBarangTujuanJabatan ?? "",
                }}
                fixedValues={{}}
                schema={AlihStatusBASTContract.create}
                createAction={actionCreateAlihStatusBAST}
                editAction={actionEditAlihStatusBAST}
                label="Persetujuan Bupati"
                onClose={async () => {
                    setFormTarget(undefined);
                }}
                onSuccess={onSuccessMutation}
            >
                {(form) => (
                    <div className="grid grid-cols-2 gap-4">
                        <TextFormField label="Nomor BAST" control={form.control} errors={form.formState.errors} name="suratNomor" />
                        <TextFormField label="Tanggal BAST" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                        <TextFormField className="col-span-2" label="Perangkat Daerah Asal" control={form.control} errors={form.formState.errors} name="perangkatDaerahAsal" />
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
                        <TextFormField className="col-span-2" label="Perangkat Daerah Tujuan" control={form.control} errors={form.formState.errors} name="perangkatDaerahTujuan" />
                        <TextFormField label="Nama Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanNama" />
                        <TextFormField label="NIP Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanNIP" format="nip" />
                        <SelectFormField
                            label="Pangkat Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanPangkat"
                            options={Object.values(PegawaiPangkatGolongan).map((item) => ({
                                value: item,
                                label: item,
                            }))}
                        />
                        <TextFormField label="Jabatan Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanJabatan" />
                    </div>
                )}
            </EntityFormModal>
        )}
    </>
}
