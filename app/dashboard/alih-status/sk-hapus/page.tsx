"use client";

import { useState } from "react";
import {
    Button,
    toast,
    Modal,
    useOverlayState,
    ButtonGroup,
    ButtonGroupSeparator,
} from "@heroui/react";
import { Edit, Eye, Plus, RefreshCcw, RefreshCw, Trash } from "lucide-react";
import { AlihStatusSKHapusContract } from "@/action/alih-status/sk-hapus/contract";
import { actionDeleteAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.delete";
import { actionGetListAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.read";
import { actionCreateAlihStatusSKHapus } from "@/action/alih-status/sk-hapus/action.create";
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
import ListAvailablePermohonanPenghapusan from "./ListAvailablePermohonanPenghapusan";
import ListAvailableData from "../_component/listAvailableData/listAvailableData";
import DetailSKHapus from "../_component/SKHapus";

const features = tableFeatures({ columnVisibilityFeature });

const columnHelper = createColumnHelper<
    typeof features,
    AlihStatusSKHapusContract.SelectDTO
>();

const queryKey = ["alih-status", "sk-hapus"];
const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

export default function SKHapus() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedPermohonanPenghapusan, setSelectedPermohonanPenghapusan] = useState<number[]>([])

    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusSKHapusContract.CreateDTO>({
        defaultValues: {
            tahun: Number(tahun)
        }
    });

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih")
            const res = await actionGetListAlihStatusSKHapus(Number(tahun));
            console.log("res", res)
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusSKHapus({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("SK Hapus berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusSKHapusContract.SelectDTO[]) => {
                    if (!old) return old;

                    return old.filter(d => d.id !== id)
                },
            );
        } catch (error: any) {
            toast.danger("Gagal menghapus SK Hapus alih status", { description: error.message });
        }
    };

    // reset seluruh state wizard, dipanggil saat modal ditutup / dibuka ulang
    const resetWizard = () => {
        setFormSelected("permohonan");
        setSelectedPermohonanPenghapusan([]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedPermohonanPenghapusan.length === 0) {
            toast.warning("Pilih minimal satu permohonan penghapusan terlebih dahulu");
            return;
        }
        if (formSelected === "data" && form.getValues("dataIds").length === 0) {
            toast.warning("Pilih minimal satu data terlebih dahulu");
            return;
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

    const onSubmit = async (values: AlihStatusSKHapusContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusSKHapus({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("SK Hapus berhasil ditambahkan")
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusSKHapusContract.SelectDTO[]) => {
                    if (!old) return old;

                    return [...old, result.data]
                },
            );
            state.close();
        } catch (error: any) {
            toast.danger("Gagal menambahkan SK Hapus", { description: error.message });
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
            <DetailSKHapus
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
                                    `/dashboard/alih-status/sk-hapus/${row.id}`
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
                                        Tambah Surat SK Hapus
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailablePermohonanPenghapusan onChange={(permohonans) => {
                                                setSelectedPermohonanPenghapusan(permohonans.map((e) => e.id))
                                            }} />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData column="permohonanPenghapusanId" values={selectedPermohonanPenghapusan} onChange={(e) => form.setValue("dataIds", e.map(d => d.id))} />
                                        ) : (

                                            <div className="grid grid-cols-2 gap-4">
                                                <TextFormField label="Nomor Surat SK Hapus" type="text" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal Surat SK Hapus" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField label="Hal Surat SK Hapus" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />

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