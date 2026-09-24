import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract"
import { Description } from "@/component/description";
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { actionCreateAlihStatusNodin } from "@/action/alih-status/nodin/action.create";
import { actionEditAlihStatusNodin } from "@/action/alih-status/nodin/action.update";
import { TextFormField } from "../../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { Edit, Printer, RefreshCw } from "lucide-react";
export default function AlihStatusnodin({ query, queryKey }: { query: UseQueryResult<AlihStatusNodinContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusNodinContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusNodinContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusNodinContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, nodin: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const generatenodin = useCallback(() => { }, [query.data])
    const refresh = () => {
        console.log("refetch")
        queryClient.refetchQueries({ queryKey })
    }
    if (query.isLoading) return <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-1/4" />
    </div>
    return <>
        <div className="flex justify-between item-center">
            <Label>Detail Berita Acara Penelitian Alih Status</Label>
            
            <ButtonGroup>
                <Button isPending={query.isRefetching} onPress={refresh}>
                    <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                </Button>
                <Button onPress={() => setFormTarget(query.data?.nodin)}><ButtonGroupSeparator /><Edit />Edit BA Penelitian</Button>
                <Button onPress={generatenodin}><ButtonGroupSeparator /><Printer />Cetak BA Penelitian</Button>
            </ButtonGroup>
        </div>
        <Description items={[
            {
                label: "Nomor Surat",
                value: query.data?.nodin.suratNomor
            },
            {
                label: "Hal Surat",
                value: query.data?.nodin.suratHal
            },
            {
                label: "Tanggal Surat",
                value: query.data?.nodin.suratTanggal
            },
        ]} />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusNodinContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusNodinContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    tahun: formTarget?.tahun ?? 0,
                    dataIds: query.data?.data.map(d => d.id) ?? [],
                }}
                fixedValues={{}}
                schema={AlihStatusNodinContract.create}
                createAction={actionCreateAlihStatusNodin}
                editAction={actionEditAlihStatusNodin}
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
                            name="suratNomor"
                            label="Nomor Surat"
                        />
                        <TextFormField
                            control={form.control}
                            errors={form.formState.errors}
                            name="suratHal"
                            label="Hal Surat"
                        />
                        <TextFormField
                            control={form.control}
                            errors={form.formState.errors}
                            name="suratTanggal"
                            label="Tanggal Surat"
                        />
                    </>
                )}
            </EntityFormModal>
        )}
    </>
}
