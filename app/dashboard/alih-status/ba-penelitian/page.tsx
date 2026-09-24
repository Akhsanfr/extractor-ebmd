"use client";

import { useState } from "react";
import {
    Button,
    toast,
    Modal,
    useOverlayState,
    ButtonGroup,
    Tooltip,
    ButtonGroupSeparator,
} from "@heroui/react";
import { Edit, Eye, Plus, RefreshCw, Trash } from "lucide-react";
import { AlihStatusBAPenelitianContract } from "@/action/alih-status/ba-penelitian/contract";
import { actionDeleteAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.delete";
import { actionGetListAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.read";
import { actionCreateAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AutocompleteFormField, TextFormField } from "../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailablePermohonan from "./ListAvailablePermohonan";
import DetailBAPenelitian from "../_component/baPenelitian";
import ListAvailableData from "../_component/listAvailableData";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";


// urutan step wizard di dalam modal
const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

export default function BaPenelitian() {
    const queryKey = ["alih-status", "ba-penelitian"];
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedPermohonanIds, setSelectedPermohonanIds] = useState<number[]>([])

    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusBAPenelitianContract.CreateDTO>({
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
            const res = await actionGetListAlihStatusBAPenelitian(Number(tahun));
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusBAPenelitian({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("Permohonan alih status berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusBAPenelitianContract.SelectDTO[]) => {
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
        setSelectedPermohonanIds([]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedPermohonanIds.length === 0) {
            toast.warning("Pilih minimal satu permohonan terlebih dahulu");
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

    const onSubmit = async (values: AlihStatusBAPenelitianContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusBAPenelitian({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("BA Penelitian berhasil ditambahkan")
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusBAPenelitianContract.SelectDTO[]) => {
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

    return (
        <>
            <DetailBAPenelitian
                action={
                    <ButtonGroup>
                        <Tooltip>
                            <Tooltip.Trigger>
                                <Button isDisabled={query.isLoading} variant="secondary" isPending={query.isRefetching} onPress={(e) => queryClient.refetchQueries({ queryKey })}>
                                    <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                                </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                Muat Ulang Berita Acara Penelitian
                            </Tooltip.Content>
                        </Tooltip>
                        <Tooltip>
                            <Tooltip.Trigger>
                                <Button variant="secondary" onPress={() => state.open()}><ButtonGroupSeparator /><Plus /></Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                Tambah Berita Acara Penelitian
                            </Tooltip.Content>
                        </Tooltip>
                    </ButtonGroup>
                }
                data={query.data ?? []} isLoading={query.isLoading} shouldTable={true} rowAction={(row) =>
                    <ButtonGroup>
                        <Tooltip>
                            <Tooltip.Trigger>
                                <Button
                                    variant="secondary" size='sm'
                                    onPress={() =>
                                        router.push(
                                            `/dashboard/alih-status/ba-penelitian/${row.id}`
                                        )
                                    }
                                >
                                    <Eye />
                                </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                Detail Berita Acara Penelitian
                            </Tooltip.Content></Tooltip>
                        <Tooltip>
                            <Tooltip.Trigger>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onPress={() => handleDelete(row.id)}
                                >
                                    <Trash />
                                </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                Hapus Berita Acara Penelitian
                            </Tooltip.Content>
                        </Tooltip>
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
                                        Tambah Berita Acara Penelitian
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailablePermohonan onChange={(permohonans) => {
                                                setSelectedPermohonanIds(permohonans.map((e) => e.id))
                                                form.setValue("penggunaBarangAsalNama", permohonans[0].penggunaBarangAsalNama)
                                            }} />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData column="permohonanId" values={selectedPermohonanIds} onChange={(e) => form.setValue("dataIds", e.map(d => d.id))} />
                                        ) : (

                                            <div className="grid grid-cols-1 gap-4">
                                                <AutocompleteFormField
                                                    control={form.control}
                                                    errors={form.formState.errors}
                                                    name="perangkatDaerahAsal"
                                                    label="Asal Perangkat Daerah"
                                                    options={PerangkatDaerah.map((perangkatDaerah) => ({
                                                        value: perangkatDaerah,
                                                        label: perangkatDaerah,
                                                    }))}
                                                />
                                                <TextFormField label="Nomor Berita Acara" type="text" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal Berita Acara" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField label="Pengguna Barang Nama" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalNama" />
                                                <TextFormField label="Pengurus Barang Nama" control={form.control} errors={form.formState.errors} name="pengurusBarangAsalNama" />
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