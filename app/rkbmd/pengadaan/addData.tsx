"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Button,
    Description,
    Input,
    Label,
    Modal,
    NumberField,
    Separator,
    Surface,
    TextField,
    useOverlayState,
} from "@heroui/react";
import { ASET_LABEL } from "@/types/bmd";
import type { AsetType, BarangAll } from "@/types/bmd";
import { AvailableKodeBarang } from "./availableKodeBarang";

export type { AsetType } from "@/types/bmd";
export type BarangSelected = BarangAll;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BarangRef {
    kodeBarang: string;
    namaBarang: string;
    jumlah: number;
    satuan: string;
}

export interface FormPengadaanData {
    // Identitas anggaran
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    // Barang yang diusulkan (diisi dari form modal / kamus barang)
    usulan: BarangRef & { asetType: AsetType };
    // BMD yang masih bisa dioptimalkan (diisi di tabel setelah submit)
    bmdBisaDioptimalkan: BarangRef | null;
    // Kebutuhan riil setelah dikurangi optimalisasi
    kebutuhanRiil: {
        jumlah: number;
        satuan: string;
    } | null;
}

export interface FormPengadaanModalProps {
    open: boolean;
    initialData?: FormPengadaanData | null;
    duplicateData?: {
        kuasaPenggunaBarang: string;
        program: string;
        kegiatan: string;
        output: string;
    } | null;
    onClose: () => void;
    onSubmit: (data: FormPengadaanData) => void;
}

// ── Internal form shape ───────────────────────────────────────────────────────
interface FormValues {
    barang: BarangSelected | null;
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    jumlah: number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 my-2">
            <Separator className="flex-1" />
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest whitespace-nowrap">
                {children}
            </span>
            <Separator className="flex-1" />
        </div>
    );
}

function BarangCard({ barang }: { barang: BarangSelected }) {
    return (
        <Surface className="rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{barang.namaBarang}</p>
                <p className="text-xs font-mono text-foreground/50 mt-0.5">{barang.kodeBarang}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap shrink-0">
                {ASET_LABEL[barang.asetType] ?? barang.asetType}
            </span>
        </Surface>
    );
}

// ─── ModalInner ────────────────────────────────────────────────────────────────

function ModalInner({
    initialData,
    duplicateData,
    onClose,
    onSubmit,
}: {
    initialData?: FormPengadaanData | null;
    duplicateData?: FormPengadaanModalProps["duplicateData"];
    onClose: () => void;
    onSubmit: (data: FormPengadaanData) => void;
}) {
    // Reconstruct BarangSelected from initialData.usulan if editing
    const defaultBarang: BarangSelected | null = initialData
        ? {
            kodeBarang: initialData.usulan.kodeBarang,
            namaBarang: initialData.usulan.namaBarang,
            jumlah: 0, // jumlah tersedia tidak tersimpan di usulan — set 0
            satuan: initialData.usulan.satuan,
            asetType: initialData.usulan.asetType,
        }
        : null;

    const { control, handleSubmit, watch, setValue, clearErrors } = useForm<FormValues>({
        defaultValues: {
            barang: defaultBarang,
            kuasaPenggunaBarang:
                initialData?.kuasaPenggunaBarang ?? duplicateData?.kuasaPenggunaBarang ?? "",
            program: initialData?.program ?? duplicateData?.program ?? "",
            kegiatan: initialData?.kegiatan ?? duplicateData?.kegiatan ?? "",
            output: initialData?.output ?? duplicateData?.output ?? "",
            jumlah: initialData?.usulan.jumlah ?? null,
        },
        mode: "onChange",
    });

    const selectedBarang = watch("barang");
    const isMounted = useRef(false);

    // Reset jumlah saat barang berganti (tapi tidak saat mount awal)
    useEffect(() => {
        if (isMounted.current) {
            setValue("jumlah", null);
            clearErrors("jumlah");
        } else {
            isMounted.current = true;
        }
    }, [selectedBarang?.kodeBarang, setValue, clearErrors]);

    const onValidSubmit = (data: FormValues) => {
        onSubmit({
            kuasaPenggunaBarang: data.kuasaPenggunaBarang,
            program: data.program,
            kegiatan: data.kegiatan,
            output: data.output,
            usulan: {
                kodeBarang: data.barang!.kodeBarang,
                namaBarang: data.barang!.namaBarang,
                jumlah: data.jumlah!,
                satuan: data.barang!.satuan,
                asetType: data.barang!.asetType,
            },
            // Pertahankan bmdBisaDioptimalkan & kebutuhanRiil jika sedang edit
            bmdBisaDioptimalkan: initialData?.bmdBisaDioptimalkan ?? null,
            kebutuhanRiil: initialData?.kebutuhanRiil ?? null,
        });
    };

    return (
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Heading className="text-base font-semibold">
                    {initialData ? "Edit Usulan Pengadaan" : "Tambah Usulan Pengadaan"}
                </Modal.Heading>
                <Description className="text-xs text-foreground/50 mt-0.5">
                    {initialData
                        ? "Ubah data usulan pengadaan"
                        : "Isi usulan pengadaan baru berdasarkan kamus barang"}
                </Description>
            </Modal.Header>

            <Modal.Body className="max-h-[70vh] overflow-y-auto">
                <form
                    id="form-pengadaan"
                    onSubmit={handleSubmit(onValidSubmit)}
                    className="flex flex-col gap-4 py-2"
                >
                    {/* ── Pilih Barang dari Kamus ── */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Kamus Barang <span className="text-danger">*</span>
                        </Label>
                        <Controller
                            control={control}
                            name="barang"
                            rules={{ required: "Pilih referensi barang terlebih dahulu." }}
                            render={({ field, fieldState: { error } }) => (
                                <AvailableKodeBarang
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={error?.message}
                                />
                            )}
                        />
                    </div>

                    {selectedBarang && <BarangCard barang={selectedBarang} />}

                    <SectionLabel>Data Anggaran</SectionLabel>

                    {(
                        [
                            {
                                name: "kuasaPenggunaBarang" as const,
                                label: "Kuasa Pengguna Barang",
                                placeholder: "Nama SKPD / unit kerja...",
                            },
                            {
                                name: "program" as const,
                                label: "Program",
                                placeholder: "Nama program...",
                            },
                            {
                                name: "kegiatan" as const,
                                label: "Kegiatan",
                                placeholder: "Nama kegiatan...",
                            },
                            {
                                name: "output" as const,
                                label: "Output",
                                placeholder: "Output kegiatan...",
                            },
                        ]
                    ).map((fieldInfo) => (
                        <Controller
                            key={fieldInfo.name}
                            control={control}
                            name={fieldInfo.name}
                            rules={{ required: `${fieldInfo.label} wajib diisi.` }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    isRequired
                                    isInvalid={!!error}
                                    className="flex flex-col gap-1.5"
                                >
                                    <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                        {fieldInfo.label}{" "}
                                        <span className="text-danger ml-0.5">*</span>
                                    </Label>
                                    <Input placeholder={fieldInfo.placeholder} />
                                    {error && (
                                        <p className="text-[11px] text-danger font-medium mt-0.5">
                                            {error.message}
                                        </p>
                                    )}
                                </TextField>
                            )}
                        />
                    ))}

                    <SectionLabel>Usulan Pengadaan</SectionLabel>

                    {/* ── Jumlah Usulan ── */}
                    <Controller
                        control={control}
                        name="jumlah"
                        rules={{
                            required: "Jumlah wajib diisi.",
                            min: { value: 1, message: "Masukkan angka minimal 1." },
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <NumberField
                                name={field.name}
                                isRequired
                                isDisabled={!selectedBarang}
                                minValue={1}
                                isInvalid={!!error}
                                value={field.value ?? undefined}
                                onChange={(v) => field.onChange(isNaN(v) ? null : v)}
                                className="flex flex-col gap-1.5"
                            >
                                <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                    Jumlah Usulan{" "}
                                    <span className="text-danger ml-0.5">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <NumberField.Group className="flex-1">
                                        <NumberField.DecrementButton />
                                        <NumberField.Input />
                                        <NumberField.IncrementButton />
                                    </NumberField.Group>
                                    <span className="text-sm text-foreground/50 font-medium shrink-0 min-w-[40px]">
                                        {selectedBarang?.satuan ?? "—"}
                                    </span>
                                </div>
                                {error && (
                                    <p className="text-[11px] text-danger font-medium mt-0.5">
                                        {error.message}
                                    </p>
                                )}
                            </NumberField>
                        )}
                    />
                </form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="ghost" size="sm" onPress={onClose}>
                    Batal
                </Button>
                <Button size="sm" type="submit" form="form-pengadaan">
                    Simpan Usulan
                </Button>
            </Modal.Footer>
        </Modal.Dialog>
    );
}

// ─── FormPengadaanModal ────────────────────────────────────────────────────────

export default function FormPengadaanModal({
    open,
    initialData,
    duplicateData,
    onClose,
    onSubmit,
}: FormPengadaanModalProps) {
    const state = useOverlayState({
        isOpen: open,
        onOpenChange: (isOpen) => {
            if (!isOpen) onClose();
        },
    });

    const getModalKey = () => {
        if (!open) return "closed";
        if (initialData)
            return `edit-${initialData.usulan.kodeBarang}-${initialData.program}`;
        if (duplicateData) return `dup-${duplicateData.program}-${Date.now()}`;
        return `new-${Date.now()}`;
    };

    return (
        <Modal state={state}>
            <Modal.Backdrop>
                <Modal.Container>
                    <ModalInner
                        key={getModalKey()}
                        initialData={initialData}
                        duplicateData={duplicateData}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}