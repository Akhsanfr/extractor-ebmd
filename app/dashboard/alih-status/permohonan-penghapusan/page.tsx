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
import { AlihStatusPermohonanPenghapusanContract } from "@/action/alih-status/permohonan-penghapusan/contract";
import { actionDeleteAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.delete";
import { actionGetListAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.read";
import { actionCreateAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createColumnHelper,
    tableFeatures,
    columnVisibilityFeature
} from "@tanstack/react-table";
import { AutocompleteFormField, SelectFormField, TextFormField } from "../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailableBAST from "./ListAvailableBAST";
import ListAvailableData from "../_component/listAvailableData/listAvailableData";
import DetailPermohonanPenghapusan from "../_component/permohonanPenghapusan";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";
import { PegawaiPangkatGolongan } from "@/enum/user";

const features = tableFeatures({ columnVisibilityFeature });

const queryKey = ["alih-status", "permohonan-penghapusan"];
const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

export default function permohonanPenghapusan() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedBAST, setSelectedBAST] = useState<number[]>([])

    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusPermohonanPenghapusanContract.CreateDTO>({
        defaultValues: {
            tahun: Number(tahun),
            suratNomor: `000.2.3.2/     /     /${tahun}`,
            suratHal: "Permohonan Penghapusan Barang Milik Daerah"
        }
    });

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih")
            const res = await actionGetListAlihStatusPermohonanPenghapusan(Number(tahun));
            console.log("res", res)
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusPermohonanPenghapusan({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("Permohonan alih status berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanPenghapusanContract.SelectDTO[]) => {
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
        setSelectedBAST([]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedBAST.length === 0) {
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

    const onSubmit = async (values: AlihStatusPermohonanPenghapusanContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusPermohonanPenghapusan({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("BA Penelitian berhasil ditambahkan")
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPermohonanPenghapusanContract.SelectDTO[]) => {
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
            <DetailPermohonanPenghapusan
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
                                    `/dashboard/alih-status/permohonan-penghapusan/${row.id}`
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
                                        Tambah Surat Permohonan Penghapusan
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailableBAST
                                                onChange={(permohonans) => {
                                                    setSelectedBAST(permohonans.map((e) => e.id));

                                                    // ambil perangkat daerah asal dari BAST yang dipilih
                                                    const asalList = [
                                                        ...new Set(permohonans.map((e) => e.perangkatDaerahAsal).filter(Boolean)),
                                                    ];
                                                    const namaList = [
                                                        ...new Set(permohonans.map((e) => e.penggunaBarangAsalNama).filter(Boolean)),
                                                    ];
                                                    const nipList = [
                                                        ...new Set(permohonans.map((e) => e.penggunaBarangAsalNIP).filter(Boolean)),
                                                    ];
                                                    const pangkatList = [
                                                        ...new Set(permohonans.map((e) => e.penggunaBarangAsalPangkat).filter(Boolean)),
                                                    ];
                                                    const jabatanList = [
                                                        ...new Set(permohonans.map((e) => e.penggunaBarangAsalJabatan).filter(Boolean)),
                                                    ];
                                                    if (asalList.length > 1) {
                                                        toast.warning("BAST yang dipilih berasal dari perangkat daerah yang berbeda");
                                                    }

                                                    form.setValue("perangkatDaerahAsal", asalList[0] ?? "", {
                                                        shouldDirty: true,
                                                    });
                                                    form.setValue("penggunaBarangAsalNama", namaList[0] ?? "", {
                                                        shouldDirty: true,
                                                    });
                                                    form.setValue("penggunaBarangAsalNIP", nipList[0] ?? "", {
                                                        shouldDirty: true,
                                                    });
                                                    form.setValue("penggunaBarangAsalPangkat", pangkatList[0] ?? "", {
                                                        shouldDirty: true,
                                                    });
                                                    form.setValue("penggunaBarangAsalJabatan", jabatanList[0] ?? "", {
                                                        shouldDirty: true,
                                                    });
                                                }}
                                            />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData column="bastId" values={selectedBAST} onChange={(e) => form.setValue("dataIds", e.map(d => d.id))} />
                                        ) : (

                                            <div className="grid grid-cols-2 gap-4">
                                                <AutocompleteFormField
                                                    className="col-span-2"
                                                    control={form.control}
                                                    errors={form.formState.errors}
                                                    name="perangkatDaerahAsal"
                                                    label="Asal Perangkat Daerah"
                                                    options={PerangkatDaerah.map((perangkatDaerah) => ({
                                                        value: perangkatDaerah,
                                                        label: perangkatDaerah,
                                                    }))}
                                                />
                                                <TextFormField label="Nomor Surat Permohonan Penghapusan" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal Surat Permohonan Penghapusan" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField className="col-span-2" label="Hal Surat Permohonan Penghapusan" control={form.control} errors={form.formState.errors} name="suratHal" />
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