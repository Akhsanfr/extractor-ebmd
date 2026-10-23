import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract"
import { Button, ButtonGroup, ButtonGroupSeparator, Modal, toast, Tooltip } from "@heroui/react";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useCallback, useState } from "react";
import { EntityFormModal } from "../../_component/entityFormModal";
import { actionCreateAlihStatusNodin } from "@/action/alih-status/nodin/action.create";
import { actionEditAlihStatusNodin } from "@/action/alih-status/nodin/action.update";
import { TextFormField } from "../../_component/formField";
import { Edit, FileSignature, FileText, Printer, RefreshCw } from "lucide-react";
import { generateNodin } from "@/lib/generateDoc/alih-status/generateNodin";
import DetailNodin from "../../_component/nodin";
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
    const [isPrintOpen, setIsPrintOpen] = useState(false);

    const print = useCallback((isTTE: boolean) => {
        try {
            if (!query.data) throw new Error("Data belum tersedia")
            generateNodin(query.data, isTTE)
            setIsPrintOpen(false)
        } catch (error: any) {
            toast.danger("Gagal mencetak draft dokumen Permohonan Penghapusan", {
                description: error.message
            });
        }
    }, [query.data]);
    return <>
        <DetailNodin data={query.data ? [query.data.nodin] : []} isLoading={query.isLoading} action={
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
                        <Button variant="secondary" onPress={() => setFormTarget(query.data?.nodin)}><ButtonGroupSeparator /><Edit /></Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Edit Permohonan Penghapusan
                    </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button
                            variant="secondary"
                            isDisabled={!query.data}
                            onPress={() => setIsPrintOpen(true)}
                        >
                            <ButtonGroupSeparator /><Printer />
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        Cetak Permohonan Penghapusan
                    </Tooltip.Content>
                </Tooltip>
            </ButtonGroup>} />
        <Modal.Backdrop isOpen={isPrintOpen} onOpenChange={setIsPrintOpen}>
            <Modal.Container>
                <Modal.Dialog className="sm:max-w-md">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                        <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                            <Printer className="size-5" />
                        </Modal.Icon>
                        <Modal.Heading>Cetak Permohonan Penghapusan</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-sm text-muted">
                            Apakah draft dokumen ini akan digunakan untuk
                            <strong> Tanda Tangan Elektronik (TTE)</strong>?
                            Format dokumen akan menyesuaikan pilihan Anda.
                        </p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="tertiary" onPress={() => setIsPrintOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="secondary" onPress={() => print(false)}>
                            <FileText className="size-4" />
                            Bukan TTE
                        </Button>
                        <Button variant="primary" onPress={() => print(true)}>
                            <FileSignature className="size-4" />
                            Format TTE
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Backdrop>
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
                            type="date"
                        />
                    </>
                )}
            </EntityFormModal>
        )}
    </>
}
