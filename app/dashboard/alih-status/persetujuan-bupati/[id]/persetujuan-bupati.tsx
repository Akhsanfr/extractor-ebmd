import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract"
import { Description } from "@/component/description";
import { Button, ButtonGroup, ButtonGroupSeparator, Label, Skeleton, toast } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { actionCreateAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.create";
import { actionEditAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.update";
import { SelectFormField, TextFormField } from "../../_component/formField";
import { AlihStatusType } from "@/enum/alihStatus";
import { Delete, Edit, Printer, RefreshCw } from "lucide-react";
export default function AlihStatusPersetujuanBupati({ query, queryKey }: { query: UseQueryResult<AlihStatusPersetujuanBupatiContract.SelectWithDetailDTO>, queryKey: unknown[] }) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusPersetujuanBupatiContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const queryClient = useQueryClient()
    const onSuccessMutation = async (result: unknown) => {
        try {

            const parsed = AlihStatusPersetujuanBupatiContract.select.parse(result);

            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPersetujuanBupatiContract.SelectWithDetailDTO) => {
                    if (!old) return old;

                    return { ...old, persetujuanBupati: parsed }
                },
            );
        } catch (error: any) {
            toast.danger('Gagal menampilkan data terbaru. Muat ulang halaman ini.', { description: error.message })
        }
    }
    const generatenodin = useCallback(() => { }, [query.data])
    if (query.isLoading) return <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-1/4" />
    </div>
    return <>
        <div className="flex justify-between item-center">
            <Label>Detail Berita Acara Penelitian Alih Status</Label>
            <ButtonGroup>
                <Button variant="outline" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
                    <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                </Button>
                <Button variant="outline" onPress={() => setFormTarget(query.data?.persetujuanBupati)}>
                    <ButtonGroupSeparator />
                    <Edit />
                </Button>
                <Button variant="outline" onPress={generatenodin}>
                    <ButtonGroupSeparator />
                    <Printer />
                </Button>
            </ButtonGroup>
        </div>
        <Description items={[
            {
                label: "Tipe Alih Status",
                value: query.data?.persetujuanBupati.alihStatusType
            },
            {
                label: "Nomor Surat",
                value: query.data?.persetujuanBupati.suratNomor
            },
            {
                label: "Hal Surat",
                value: query.data?.persetujuanBupati.suratHal
            },
            {
                label: "Tanggal Surat",
                value: query.data?.persetujuanBupati.suratTanggal
            },
        ]} />
        {formTarget !== undefined && (
            <EntityFormModal<AlihStatusPersetujuanBupatiContract.CreateDTO>
                target={
                    formTarget as
                    | (AlihStatusPersetujuanBupatiContract.CreateDTO & { id: number })
                    | null
                }
                defaultValues={{
                    alihStatusType: formTarget?.alihStatusType ?? AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN,
                    tahun: formTarget?.tahun ?? 0,
                    dataIds: query.data?.data.map(d => d.id) ?? [],
                }}
                fixedValues={{}}
                schema={AlihStatusPersetujuanBupatiContract.create}
                createAction={actionCreateAlihStatusPersetujuanBupati}
                editAction={actionEditAlihStatusPersetujuanBupati}
                label="Persetujuan Bupati"
                onClose={async () => {
                    setFormTarget(undefined);
                }}
                onSuccess={onSuccessMutation}
            >
                {(form) => (
                    <>
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
                            name="suratHal"
                            label="Hal Surat"
                        />
                        <TextFormField
                            control={form.control}
                            errors={form.formState.errors}
                            name="suratTanggal"
                            label="Tanggal Surat"
                            type="date"
                        />
                    </>
                )}
            </EntityFormModal>
        )}
    </>
}
