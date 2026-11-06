"use client";

import { useMemo, useState } from "react";
import {
    Button,
    toast,
    Modal,
    useOverlayState,
    ButtonGroup,
    ButtonGroupSeparator,
    Tabs,
} from "@heroui/react";
import { Eye, Plus, RefreshCw, Trash } from "lucide-react";
import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract";
import { actionDeleteAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.delete";
import { actionGetListAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.read";
import { actionCreateAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TextFormField } from "../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailableNodin from "./ListAvailableNodin";
import { AlihStatusType } from "@/enum/alihStatus";
import DetailPersetujuanBupati from "../_component/persetujuanBupati";
import ListAvailableData from "../_component/listAvailableData/listAvailableData";
import { angkaKeKata } from "@/lib/number";
import ListAvailablePermohonan from "./ListAvailablePermohonan";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { joinDenganDan } from "@/lib/text";

const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

type StatusFilter = "all" | "done" | "pending";

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "Semua" },
    { id: "done", label: "Selesai" },
    { id: "pending", label: "Belum Selesai" },
];

const ALIH_STATUS_TABS = [
    AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN,
    AlihStatusType.PENYERAHAN_KEPADA_PENGELOLA,
];

export default function PersetujuanBupati() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();

    const [alihStatusType, setAlihStatusType] = useState<AlihStatusType>(
        AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN,
    );
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    // Sumber data wizard: nodin (Pengalihan Status Penggunaan) atau permohonan (Penyerahan kepada Pengelola)
    const [selectedNodinIds, setSelectedNodinIds] = useState<number[]>([]);
    const [selectedPermohonanIds, setSelectedPermohonanIds] = useState<number[]>([]);
    const [selectedData, setSelectedData] = useState<
        AlihStatusDataContract.SelectDTO[]
    >([]);
    const [formSelected, setFormSelected] = useState<FormStep>("permohonan");

    const isPengalihan = alihStatusType === AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN;

    const buildDefaults = (type: AlihStatusType): AlihStatusPersetujuanBupatiContract.CreateDTO =>
        ({
            tahun: Number(tahun),
            alihStatusType: type,
            dataIds: [],
            suratTanggal: null,
            suratHal: "",
            suratNomor: `000.2.3.2/     /${Number(tahun)}`,
        }) as AlihStatusPersetujuanBupatiContract.CreateDTO;

    const form = useForm<AlihStatusPersetujuanBupatiContract.CreateDTO>({
        defaultValues: buildDefaults(alihStatusType),
    });

    const queryKey = ["alih-status", "persetujuan-bupati", tahun, alihStatusType];

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih");
            const res = await actionGetListAlihStatusPersetujuanBupati({
                tahun: Number(tahun),
                alihStatusType,
            });
            if (!res.success) throw res.error;
            return res.data;
        },
    });

    // Filter status (Semua / Selesai / Belum Selesai) diterapkan sebelum masuk ke tabel
    const filteredData = useMemo(() => {
        const rows = query.data ?? [];
        if (statusFilter === "all") return rows;
        return rows.filter((d) => d.isDone === (statusFilter === "done"));
    }, [query.data, statusFilter]);

    // Reset seluruh state wizard (nodin, permohonan, data terpilih, step, dan form)
    const resetWizard = (type: AlihStatusType = alihStatusType) => {
        setFormSelected("permohonan");
        setSelectedNodinIds([]);
        setSelectedPermohonanIds([]);
        setSelectedData([]);
        form.reset(buildDefaults(type));
    };

    // onOpenChange menangkap semua jalur penutupan: tombol X, backdrop, Escape, maupun state.close()
    const state = useOverlayState({
        onOpenChange: (open) => {
            if (!open) resetWizard();
        },
    });

    const handleChangeType = (type: AlihStatusType) => {
        if (type === alihStatusType) return;
        setAlihStatusType(type);
        // pilihan nodin / permohonan milik tipe sebelumnya tidak boleh terbawa
        resetWizard(type);
    };

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusPersetujuanBupati({ id });
            if (!result.success) throw result.error;
            toast.success("Persetujuan Bupati berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPersetujuanBupatiContract.SelectDTO[]) => {
                    if (!old) return old;
                    return old.filter((d) => d.id !== id);
                },
            );
        } catch (error: any) {
            toast.danger("Gagal menghapus Persetujuan Bupati", { description: error.message });
        }
    };

    const handleNext = () => {
        if (formSelected === "permohonan") {
            const selectedCount = isPengalihan
                ? selectedNodinIds.length
                : selectedPermohonanIds.length;
            if (selectedCount === 0) {
                toast.warning("Pilih minimal satu permohonan terlebih dahulu");
                return;
            }
        }

        if (formSelected === "data") {
            if (form.getValues("dataIds").length === 0) {
                toast.warning("Pilih minimal satu data terlebih dahulu");
                return;
            }

            // const formatList = (items: string[]): string => {
            //     if (items.length <= 1) return items[0] ?? "";
            //     if (items.length === 2) return `${items[0]} dan ${items[1]}`;
            //     return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
            // };

            // Ambil nilai unik, buang null/undefined/string kosong, dan rapikan spasi
            const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
                Array.from(
                    new Set(
                        values
                            .map((v) => v?.trim())
                            .filter((v): v is string => !!v)
                    )
                );

            const uniquePerangkatDaerah = uniqueNonEmpty(
                selectedData.map((d) => d.perangkatDaerahAsal)
            );
            const uniqueAssetType = uniqueNonEmpty(
                selectedData.map((d) => d.assetType)
            );

            const jenisAset = uniqueAssetType.length
                ? `${joinDenganDan(uniqueAssetType)}`
                : "";
            const perangkatDaerah = uniquePerangkatDaerah.length
                ? `${joinDenganDan(uniquePerangkatDaerah)}`
                : "";

            if (alihStatusType === AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN) {
                form.setValue(
                    "suratHal",
                    `Persetujuan Pengalihan Status Penggunaan Barang Milik Daerah Berupa ${jenisAset} dari ${perangkatDaerah}`
                );
            } else {

                form.setValue(
                    "suratHal",
                    `Penyerahan Barang Milik Daerah Berupa ${jenisAset} Yang Tidak Digunakan Untuk Kepentingan Penyelenggaraan Tugas Dan Fungsi ${perangkatDaerah} Kepada Pengelola Barang Milik Daerah`
                );
            }
        }

        const nextIndex = stepIndex + 1;
        if (nextIndex < STEPS.length) setFormSelected(STEPS[nextIndex]);
    };

    const handlePrev = () => {
        const prevIndex = stepIndex - 1;
        if (prevIndex >= 0) setFormSelected(STEPS[prevIndex]);
    };

    const onSubmit = async (values: AlihStatusPersetujuanBupatiContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusPersetujuanBupati({
                ...values,
                alihStatusType, // selalu ikut tab aktif
                suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal,
            });
            if (!result.success) throw result.error;
            toast.success("Persetujuan Bupati berhasil ditambahkan");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusPersetujuanBupatiContract.SelectDTO[]) => {
                    if (!old) return old;
                    return [...old, result.data];
                },
            );
            state.close(); // reset ditangani onOpenChange
        } catch (error: any) {
            toast.danger("Gagal menambahkan Persetujuan Bupati", { description: error.message });
        }
    };

    const onError = (formErrors: unknown) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(formErrors) });
    };

    const refresh = () => {
        queryClient.refetchQueries({ queryKey });
    };

    return (
        <>
            <Tabs
                selectedKey={alihStatusType}
                onSelectionChange={(key) => handleChangeType(String(key) as AlihStatusType)}
            >
                <Tabs.ListContainer>
                    <Tabs.List aria-label="Jenis alih status">
                        {ALIH_STATUS_TABS.map((t) => (
                            <Tabs.Tab key={t} id={t}>
                                {t}
                                <Tabs.Indicator />
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs.ListContainer>
            </Tabs>

            <DetailPersetujuanBupati
                action={
                    <div className="flex items-center gap-2">
                        <ButtonGroup aria-label="Filter status persetujuan bupati">
                            {STATUS_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.id}
                                    size="sm"
                                    variant={statusFilter === opt.id ? "primary" : "outline"}
                                    onPress={() => setStatusFilter(opt.id)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </ButtonGroup>
                        <ButtonGroup>
                            <Button
                                variant="outline"
                                isPending={query.isRefetching}
                                onPress={refresh}
                            >
                                <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                            </Button>
                            <Button variant="outline" onPress={() => state.open()}>
                                <ButtonGroupSeparator />
                                <Plus />
                            </Button>
                        </ButtonGroup>
                    </div>
                }
                data={filteredData}
                isLoading={query.isLoading}
                shouldTable={true}
                rowAction={(row) => (
                    <ButtonGroup>
                        <Button
                            variant="secondary"
                            size="sm"
                            onPress={() =>
                                router.push(`/dashboard/alih-status/persetujuan-bupati/${row.id}`)
                            }
                        >
                            <Eye />
                        </Button>
                        <Button size="sm" variant="danger" onPress={() => handleDelete(row.id)}>
                            <ButtonGroupSeparator />
                            <Trash />
                        </Button>
                    </ButtonGroup>
                )}
            />

            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container size={formSelected === "ba" ? "lg" : "cover"}>
                        <Modal.Dialog>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
                                <Modal.CloseTrigger />
                                <Modal.Header>
                                    <Modal.Heading>Tambah Persetujuan Bupati</Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {formSelected === "permohonan" ? (
                                        isPengalihan ? (
                                            <ListAvailableNodin
                                                key="nodin"
                                                onChange={(nodins) =>
                                                    setSelectedNodinIds(nodins.map((e) => e.id))
                                                }
                                            />
                                        ) : (
                                            <ListAvailablePermohonan
                                                key="permohonan"
                                                onChange={(permohonans) =>
                                                    setSelectedPermohonanIds(
                                                        permohonans.map((e) => e.id),
                                                    )
                                                }
                                            />
                                        )
                                    ) : formSelected === "data" ? (
                                        <ListAvailableData
                                            key={alihStatusType}
                                            column={isPengalihan ? "nodinId" : "permohonanId"}
                                            values={
                                                isPengalihan ? selectedNodinIds : selectedPermohonanIds
                                            }
                                            onChange={(e) => {
                                                form.setValue(
                                                    "dataIds",
                                                    e.map((d) => d.id),
                                                );
                                                setSelectedData(e);
                                            }}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <p className="col-span-2 text-sm text-muted">
                                                Jenis Alih Status: <b>{alihStatusType}</b>
                                            </p>
                                            <TextFormField
                                                label="Nomor Persetujuan Bupati"
                                                control={form.control}
                                                errors={form.formState.errors}
                                                name="suratNomor"
                                            />
                                            <TextFormField
                                                label="Tanggal Persetujuan Bupati"
                                                type="date"
                                                control={form.control}
                                                errors={form.formState.errors}
                                                name="suratTanggal"
                                            />
                                            <TextFormField
                                                label="Hal Persetujuan Bupati"
                                                className="col-span-2"
                                                control={form.control}
                                                errors={form.formState.errors}
                                                name="suratHal"
                                            />
                                        </div>
                                    )}
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
                                            isPending={form.formState.isSubmitting}
                                            onPress={() => form.handleSubmit(onSubmit, onError)()}
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
            </Modal>
        </>
    );
}