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
import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract";
import { actionDeleteAlihStatusNodin } from "@/action/alih-status/nodin/action.delete";
import { actionGetListAlihStatusNodin } from "@/action/alih-status/nodin/action.read";
import { actionCreateAlihStatusNodin } from "@/action/alih-status/nodin/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SelectFormField, TextFormField } from "../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailableData from "../_component/listAvailableData/listAvailableData";
import DetailNodin from "../_component/nodin";
import ListAvailableBAPenelitian from "./ListAvailableBAPenelitian";
import { angkaKeKata } from "@/lib/number";



const queryKey = ["alih-status", "nodin"];
const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

export default function Nodin() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedBAPenelitian, setselectedBAPenelitian] = useState<number[]>([])
    const [selectedData, setSelectedData] = useState<
        { id: number; perangkatDaerahAsal: string | null }[]
    >([]);


    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusNodinContract.CreateDTO>({
        defaultValues: {
            tahun: Number(tahun),
            suratNomor: "000.2.3.2/     /202/2026"
        }
    });

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih")
            const res = await actionGetListAlihStatusNodin(Number(tahun));
            console.log("res", res)
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusNodin({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("Nota Dinas berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusNodinContract.SelectDTO[]) => {
                    if (!old) return old;

                    return old.filter(d => d.id !== id)
                },
            );
        } catch (error: any) {
            toast.danger("Gagal menghapus Nota Dinas alih status", { description: error.message });
        }
    };

    // reset seluruh state wizard, dipanggil saat modal ditutup / dibuka ulang
    const resetWizard = () => {
        setFormSelected("permohonan");
        setselectedBAPenelitian([]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedBAPenelitian.length === 0) {
            toast.warning("Pilih minimal satu permohonan penghapusan terlebih dahulu");
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
                    ? `Permohonan Persetujaun atas pengalihan Status Barang Milik Daerah dari ${uniquePerangkatDaerah[0]}`
                    : `Permohonan Persetujaun atas pengalihan Status Barang Milik Daerah dari ${angkaKeKata(
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

    const onSubmit = async (values: AlihStatusNodinContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusNodin({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("Nota Dinas berhasil ditambahkan")
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusNodinContract.SelectDTO[]) => {
                    if (!old) return old;

                    return [...old, result.data]
                },
            );
            state.close();
        } catch (error: any) {
            toast.danger("Gagal menambahkan Nota Dinas", { description: error.message });
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
            <DetailNodin
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
                                    `/dashboard/alih-status/nota-dinas/${row.id}`
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
                                        Tambah Surat Nota Dinas
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailableBAPenelitian onChange={(BAPenelitians) => {
                                                setselectedBAPenelitian(BAPenelitians.map((e) => e.id))
                                            }} />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData column="BAPenelitianId" values={selectedBAPenelitian} onChange={(e) => {
                                                form.setValue("dataIds", e.map(d => d.id))
                                                setSelectedData(e);
                                            }
                                            }
                                            />
                                        ) : (

                                            <div className="grid grid-cols-2 gap-4">
                                                <TextFormField label="Nomor Surat Nota Dinas" type="text" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal Surat Nota Dinas" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField label="Hal Surat Nota Dinas" control={form.control} errors={form.formState.errors} name="suratHal" className="col-span-2" />

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