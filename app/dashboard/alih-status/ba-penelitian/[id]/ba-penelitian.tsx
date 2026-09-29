import { AlihStatusBAPenelitianContract } from "@/action/alih-status/ba-penelitian/contract"
import { Description } from "@/component/description";
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast, Tooltip } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { actionCreateAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.create";
import { actionEditAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.update";
import { TextFormField } from "../../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { formatTanggalSurat } from "@/lib/date";
import { generateDocument } from "@/lib/generateDoc";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { Edit, Printer, RefreshCw } from "lucide-react";
import DetailBAPenelitian from "../../_component/baPenelitian";
import { generateBAPenelitian } from "@/lib/generateDoc/alih-status/generateBAPenelitian";
export default function AlihStatusBAPenelitian({ query, queryKey }: { query: UseQueryResult<AlihStatusBAPenelitianContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusBAPenelitianContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusBAPenelitianContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusBAPenelitianContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, BAPenelitian: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const print = useCallback(() => {
        try {
            if (!query.data) throw new Error("Data belum tersedia")
            generateBAPenelitian(query.data)
        } catch (error: any) {
            toast.danger("Gagal mencetak draft dokumen Permohonan Penghapusan", {
                description: error.message
            });
        }
    }, [query.data]);
    return <>
        <DetailBAPenelitian
            action={<ButtonGroup>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button isDisabled={query.isLoading} variant="outline" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
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
                        <Button variant="outline" onPress={() => setFormTarget(query.data?.BAPenelitian)}><Edit /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Edit BA Penelitian
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="outline" onPress={print}><ButtonGroupSeparator /><Printer /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Cetak BA Penelitian
                    </Tooltip.Content>
                </Tooltip>
            </ButtonGroup>}
            data={query.data?.BAPenelitian ? [query.data?.BAPenelitian] : []} isLoading={query.isLoading}
        />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusBAPenelitianContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusBAPenelitianContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    tahun: formTarget?.tahun ?? 0,
                    dataIds: query.data?.data.map(d => d.id) ?? [],
                }}
                fixedValues={{}}
                schema={AlihStatusBAPenelitianContract.create}
                createAction={actionCreateAlihStatusBAPenelitian}
                editAction={actionEditAlihStatusBAPenelitian}
                label="BA Penelitian"
                onClose={async () => {
                    setFormTarget(undefined);
                }}
                onSuccess={onSuccessMutation}
            >
                {(form) => (
                    <>
                        <TextFormField
                            control={form.control}
                            errors={form.formState.errors}
                            name="perangkatDaerahAsal"
                            label="Perangkat Daerah Asal"
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
                            name="penggunaBarangAsalNama"
                            label="Nama Pengguna Barang Asal"

                        />
                        <TextFormField
                            control={form.control}
                            errors={form.formState.errors}
                            name="pengurusBarangAsalNama"
                            label="Nama Pengurus Barang Asal"

                        />
                    </>
                )}
            </EntityFormModal>
        )}
    </>
}
