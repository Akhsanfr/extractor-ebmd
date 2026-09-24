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
} from "@heroui/react";
import { Edit, Eye, Trash } from "lucide-react";
import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract";
import { actionDeleteAlihStatusNodin } from "@/action/alih-status/nodin/action.delete";
import { actionGetListAlihStatusNodin } from "@/action/alih-status/nodin/action.read";
import { actionCreateAlihStatusNodin } from "@/action/alih-status/nodin/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createColumnHelper,
    tableFeatures,
    useTable, columnVisibilityFeature
} from "@tanstack/react-table";
import { EntityFormModal } from "../_component/entityFormModal";
import { SelectFormField, TextFormField } from "../_component/formField";
import { AlihStatusType } from "@/enum/alihStatus";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailableBAPenelitian from "./ListAvailableBAPenelitian";
import { TableCellStack } from "../_component/data/tableCellStack";
import { angkaKeKata } from "@/lib/number";
import ListAvailableData from "../_component/listAvailableData";

const features = tableFeatures({ columnVisibilityFeature });

const columnHelper = createColumnHelper<
    typeof features,
    AlihStatusNodinContract.SelectDTO
>();

const QUERY_KEY = ["alih-status", "nodin"];

// urutan step wizard di dalam modal
const STEPS = ["permohonan", "data", "ba"] as const;
type FormStep = (typeof STEPS)[number];

export default function Nodin() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedBAPenelitianIds, setSelectedBAPenelitianIds] = useState<number[]>([])

    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusNodinContract.CreateDTO>({
        defaultValues: {
            tahun: Number(tahun),
            suratNomor: `000.2.3.2/     /202/${tahun}`
        }
    });
    const [selectedData, setSelectedData] = useState<
        { id: number; perangkatDaerahAsal: string | null }[]
    >([]);

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const query = useQuery({
        queryKey: QUERY_KEY,
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
            toast.success("Permohonan alih status berhasil dihapus");
            queryClient.setQueryData(
                QUERY_KEY,
                (old: AlihStatusNodinContract.SelectDTO[]) => {
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
        setSelectedBAPenelitianIds([]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedBAPenelitianIds.length === 0) {
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
                    ? `Permohonan Persetujuan Bupati atas pengalihan Status Barang Milik Daerah dari ${uniquePerangkatDaerah[0]}`
                    : `Permohonan Persetujuan Bupati atas pengalihan Status Barang Milik Daerah dari ${angkaKeKata(
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

    const columns = columnHelper.columns([
        columnHelper.accessor("id", {
            header: "ID",
            cell: (ctx) => `# ${ctx.row.original.id}`
        }),
        columnHelper.accessor("suratNomor", {
            header: "Nomor Surat",
            cell: (ctx) => <TableCellStack columns={[ctx.row.original.suratNomor, ctx.row.original.suratTanggal, ctx.row.original.suratHal]} />
        }),
        columnHelper.display({
            id: "aksi",
            header: "Aksi",
            cell: (ctx) => {
                const item = ctx.row.original;
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onPress={() =>
                                router.push(
                                    `/dashboard/alih-status/nota-dinas/${item.id}`
                                )
                            }
                        >
                            <Eye />
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onPress={() => handleDelete(item.id)}
                        >
                            <Trash />
                        </Button>
                    </div>
                );
            },
        }),
    ]);

    const table = useTable({
        data: query.data ?? [],
        columns,
        features,
    });
    const state = useOverlayState();

    const onSubmit = async (values: AlihStatusNodinContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusNodin({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("BA Penelitian berhasil ditambahkan")
            queryClient.setQueryData(
                QUERY_KEY,
                (old: AlihStatusNodinContract.SelectDTO[]) => {
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


    const rows = table.getRowModel().rows;
    return (
        <>
            <div className="flex justify-between">
                <Button onPress={() => { resetWizard(); state.open(); }}>
                    Tambah BA Penelitian
                </Button>
            </div>{
                query.isLoading ?
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-1/3 rounded-lg" />
                        <Skeleton className="h-3 w-2/3 rounded-lg" />
                        <Skeleton className="h-3 w-1/2 rounded-lg" />
                    </div> :
                    query.isError ?
                        <Alert status="danger">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Gagal memuat data</Alert.Title>
                                <Alert.Description>
                                    Ada yang tidak beres. Kami cek dulu ya.
                                </Alert.Description>
                            </Alert.Content>
                        </Alert>
                        :
                        <Table aria-label="Tabel BA Penelitian">
                            <Table.ScrollContainer>
                                <Table.Content aria-label="Tabel group alih status">
                                    <TableHeader>
                                        {table.getHeaderGroups()[0]?.headers.map((header, idx) => (
                                            <TableColumn key={header.id} isRowHeader={idx === 0}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : typeof header.column.columnDef.header === "function"
                                                        ? header.column.columnDef.header(header.getContext())
                                                        : header.column.columnDef.header}
                                            </TableColumn>
                                        ))}
                                    </TableHeader>
                                    <TableBody >
                                        {
                                            rows.length === 0 ?
                                                <TableRow>
                                                    <TableCell colSpan={columns.length} className="text-center">
                                                        Belum ada data
                                                    </TableCell>
                                                </TableRow> :
                                                rows.map((row) => (
                                                    <TableRow key={row.id}>
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell key={cell.id}>
                                                                {typeof cell.column.columnDef.cell === "function"
                                                                    ? cell.column.columnDef.cell(cell.getContext())
                                                                    : (cell.getValue() as any)}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>))
                                        }
                                    </TableBody >
                                </Table.Content>
                            </Table.ScrollContainer>
                        </Table>
            }
            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container size={formSelected === "ba" ? "lg" : "cover"}>
                        <Modal.Dialog>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
                                <Modal.CloseTrigger onPress={handleCloseModal} />
                                <Modal.Header>
                                    <Modal.Heading>
                                        Tambah Nota Dinas
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailableBAPenelitian onChange={(permohonans) => {
                                                setSelectedBAPenelitianIds(permohonans.map((e) => e.id))
                                            }} />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData
                                                values={selectedBAPenelitianIds}
                                                column="BAPenelitianId" onChange={(e) => {
                                                    form.setValue("dataIds", e.map(i => i.id))
                                                    setSelectedData(e)
                                                }} />
                                        ) : (

                                            <div className="grid grid-cols-2 gap-4">
                                                <TextFormField label="Nomor Nota Dinas" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal Nota Dinas" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField label="Hal Nota Dinas" control={form.control} errors={form.formState.errors} name="suratHal" className="col-span-2" />
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