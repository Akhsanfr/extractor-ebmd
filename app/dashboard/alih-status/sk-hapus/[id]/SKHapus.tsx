import { AlihStatusSKHapusContract } from "@/action/alih-status/sk-hapus/contract"
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { TextFormField } from "../../_component/formField";
import { Delete, Edit, RefreshCw } from "lucide-react";
import { actionCreateAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.create";
import { actionEditAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.update";
import DetailSKHapus from "../../_component/SKHapus";
export default function AlihStatusSKHapus({ query, queryKey }: { query: UseQueryResult<AlihStatusSKHapusContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusSKHapusContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusSKHapusContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusSKHapusContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, SKHapus: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const generatenodin = useCallback(() => { }, [query.data])
    return <>
        <DetailSKHapus data={query.data ? [query.data.SKHapus] : []} isLoading={query.isLoading} action={<ButtonGroup>
            <Button variant="secondary" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
                <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
            </Button>
            <Button variant="secondary" onPress={() => setFormTarget(query.data?.SKHapus)}>
                <ButtonGroupSeparator />
                <Edit />
            </Button>
            <Button variant="secondary" onPress={generatenodin}>
                <ButtonGroupSeparator />
                <Delete />
            </Button>
        </ButtonGroup>} />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusSKHapusContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusSKHapusContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    tahun: formTarget?.tahun ?? 0,
                    dataIds: query.data?.data.map((d) => d.id) ?? [],
                    suratNomor: formTarget?.suratNomor ?? "",
                    suratTanggal: formTarget?.suratTanggal ?? "",
                    suratHal: formTarget?.suratHal ?? "",
                }}
                fixedValues={{}}
                schema={AlihStatusSKHapusContract.create}
                createAction={actionCreateAlihStatusSKHapus}
                editAction={actionEditAlihStatusSKHapus}
                label="Persetujuan Bupati"
                onClose={async () => {
                    setFormTarget(undefined);
                }}
                onSuccess={onSuccessMutation}
            >
                {(form) => (
                    <div className="grid grid-cols-2 gap-4">
                        <TextFormField label="Nomor Surat SK Hapus" control={form.control} errors={form.formState.errors} name="suratNomor" />
                        <TextFormField label="Tanggal Surat SK Hapus" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                        <TextFormField label="Tanggal Surat SK Hapus" control={form.control} errors={form.formState.errors} name="suratHal" />
                    </div>
                )}
            </EntityFormModal>
        )}
    </>
}
