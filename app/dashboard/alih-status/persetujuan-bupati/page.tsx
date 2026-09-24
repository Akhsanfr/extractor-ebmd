"use client";

import { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    toast,
    Modal,
    useOverlayState,
    Skeleton,
    Alert,
    ButtonGroup,
    ButtonGroupSeparator,
    Description,
} from "@heroui/react";
import { Edit, Eye, Plus, RefreshCcw, RefreshCw, Trash } from "lucide-react";
import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract";
import { actionDeleteAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.delete";
import { actionGetListAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.read";
import { actionCreateAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createColumnHelper,
    tableFeatures,
    useTable, columnVisibilityFeature
} from "@tanstack/react-table";
import { SelectFormField, TextFormField } from "../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailableNodin from "./ListAvailableNodin";
// import ListAvailableData from "./ListAvailableData";
import { TableCellStack } from "../_component/data/tableCellStack";
import { AlihStatusType } from "@/enum/alihStatus";
import DetailPersetujuanBupati from "../_component/persetujuanBupati";
import ListAvailableData from "../_component/listAvailableData";
import { angkaKeKata } from "@/lib/number";

const features = tableFeatures({ columnVisibilityFeature });

const columnHelper = createColumnHelper<
    typeof features,
    AlihStatusPersetujuanBupatiContract.SelectDTO
>();

const queryKey = ["alih-status", "persetujuanBupati"];
const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

export default function PersetujuanBupati() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedNodinIds, setSelectedNodinIds] = useState<number[]>([]);
    const [selectedData, setSelectedData] = useState<
        { id: number; perangkatDaerahAsal: string | null }[]
    >([]);

    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusPersetujuanBupatiContract.CreateDTO>({
        defaultValues: {
            tahun: Number(tahun),
            suratTanggal: null,
            suratHal: "Persetujuan Pengalihan Status Penggunaan Barang Milik Daerah",
            suratNomor: `000.2.3.2/     /${Number(tahun)}`,
        }
    });

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih")
            const res = await actionGetListAlihStatusPersetujuanBupati(Number(tahun));
            console.log("res", res)
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusPersetujuanBupati({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("Permohonan alih status berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPersetujuanBupatiContract.SelectDTO[]) => {
                    if (!old) return old;

                    return old.filter(d => d.id !== id)
                },
            );
        } catch (error: any) {
            toast.danger("Gagal permohonan alih status", { description: error.message });
        }
    };

    // reset seluruh state wizard, dipanggil saat modal ditutup / dibuka ulang
    const resetWizard = () => {
        setFormSelected("permohonan");
        setSelectedNodinIds([]);
        setSelectedData([]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedNodinIds.length === 0) {
            toast.warning("Pilih minimal satu permohonan terlebih dahulu");
            return;
        }
        if (formSelected === "data") {
            if (form.getValues("dataIds").length === 0) {
                toast.warning("Pilih minimal satu data terlebih dahulu");
                return;
            }

            const uniquePerangkatDaerah = Array.from(
                new Set(selectedData.map((d) => d.perangkatDaerahAsal))
            );

            form.setValue(
                "suratHal",
                uniquePerangkatDaerah.length === 1
                    ? `Persetujuan Bupati atas pengalihan Status Barang Milik Daerah dari ${uniquePerangkatDaerah[0]}`
                    : `Persetujuan Bupati atas pengalihan Status Barang Milik Daerah dari ${angkaKeKata(
                        uniquePerangkatDaerah.length
                    )} Perangkat Daerah`
            );
        }

        const nextIndex = stepIndex + 1;
        if (nextIndex < STEPS.length) {
            setFormSelected(STEPS[nextIndex]);
        }
    };

    const handlePrev = () => {
        const prevIndex = stepIndex - 1;
        if (prevIndex >= 0) {
            setFormSelected(STEPS[prevIndex]);
        }
    };

    const handleCloseModal = () => {
        state.close();
        resetWizard();
    };

    const state = useOverlayState();

    const onSubmit = async (values: AlihStatusPersetujuanBupatiContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusPersetujuanBupati({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("BA Penelitian berhasil ditambahkan")
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPersetujuanBupatiContract.SelectDTO[]) => {
                    if (!old) return old;

                    return [...old, result.data]
                },
            );
            state.close();
        } catch (error: any) {
            toast.danger("Gagal menambahkan BA Penelitian", { description: error.message });
        }
    };
    const onError = (formErrors: unknown) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(formErrors) });
    };

    const refresh = () => {
        queryClient.refetchQueries({
            queryKey
        })
    }
    return (
        <>
            <DetailPersetujuanBupati
                action={
                    <ButtonGroup>
                        <Button variant="outline" isPending={query.isRefetching} onPress={refresh}>
                            <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                        </Button>
                        <Button variant="outline" onPress={() => { resetWizard(); state.open(); }}>
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
                                    `/dashboard/alih-status/persetujuan-bupati/${row.id}`
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
                            <Trash />
                        </Button>
                    </ButtonGroup>
                }
            />
            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container size={formSelected === "ba" ? "lg" : "cover"}>
                        <Modal.Dialog>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
                                <Modal.CloseTrigger onPress={handleCloseModal} />
                                <Modal.Header>
                                    <Modal.Heading>
                                        Tambah Persetujuan Bupati
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailableNodin onChange={(permohonans) => {
                                                setSelectedNodinIds(permohonans.map((e) => e.id))
                                            }} />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData column="nodinId" values={selectedNodinIds} onChange={(e) => {
                                                form.setValue("dataIds", e.map((d) => d.id));
                                                setSelectedData(e);
                                            }} />
                                        ) : (

                                            <div className="grid grid-cols-2 gap-4">
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
                                                <TextFormField label="Nomor Persetujuan Bupati" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal Persetujuan Bupati" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField label="Hal Persetujuan Bupati" className="col-span-2" control={form.control} errors={form.formState.errors} name="suratHal" />

                                            </div>

                                        )
                                    }
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        onPress={handlePrev}
                                        isDisabled={isFirstStep}
                                    >
                                        Sebelumnya
                                    </Button>
                                    {isLastStep ? (
                                        <Button
                                            type="button"
                                            onClick={form.handleSubmit(onSubmit, onError)}
                                        >
                                            Simpan
                                        </Button>
                                    ) : (
                                        <Button type="button" onPress={handleNext}>
                                            Selanjutnya
                                        </Button>
                                    )}
                                </Modal.Footer>
                            </form>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal >
        </>
    );
}