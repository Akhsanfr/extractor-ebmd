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
import { BarangSelectField } from "@/component/barangSelectField"; // Sesuaikan path jika perlu
import { ASET_LABEL } from "@/types/bmd";
import type { AsetType, BarangAll } from "@/types/bmd";

export type { AsetType } from "@/types/bmd";
export type BarangSelected = BarangAll;
export interface FormPemeliharaanData {
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    kodeBarang: string;
    namaBarang: string;
    jumlahTersedia: number;
    satuan: string;
    asetType: AsetType;
    namaPemeliharaan: string;
    jumlah: number;
}

export interface FormPemeliharaanModalProps {
    open: boolean;
    initialData?: FormPemeliharaanData | null;
    // Tambahkan properti duplicateData
    duplicateData?: {
        kuasaPenggunaBarang: string;
        program: string;
        kegiatan: string;
        output: string;
    } | null;
    initialBarang?: BarangSelected | null;
    onClose: () => void;
    onSubmit: (data: FormPemeliharaanData) => void;
}
interface FormValues {
    barang: BarangSelected | null;
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    namaPemeliharaan: string;
    jumlah: number | null;
}

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

function BarangCard({ barang, jumlahDipakai }: { barang: BarangSelected; jumlahDipakai: number }) {
    const valid = jumlahDipakai > 0 && jumlahDipakai <= barang.jumlah;
    const pct = valid ? (jumlahDipakai / barang.jumlah) * 100 : 0;

    return (
        <Surface className="rounded-xl px-4 py-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{barang.namaBarang}</p>
                    <p className="text-xs font-mono text-foreground/50 mt-0.5">{barang.kodeBarang}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap shrink-0">
                    {ASET_LABEL[barang.asetType]}
                </span>
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-foreground/50">Jumlah tersedia</span>
                <span className="font-semibold text-foreground">
                    {barang.jumlah} {barang.satuan}
                </span>
            </div>

            {valid && (
                <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-default-200 overflow-hidden">
                        <div
                            className={[
                                "h-full rounded-full transition-all duration-300",
                                pct > 90 ? "bg-danger" : pct > 60 ? "bg-warning" : "bg-success",
                            ].join(" ")}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-foreground/40 text-right">
                        {jumlahDipakai} dari {barang.jumlah} {barang.satuan} ({pct.toFixed(0)}%)
                    </p>
                </div>
            )}
        </Surface>
    );
}

function ModalInner({
    initialData,
    duplicateData, // Terima prop baru
    initialBarang,
    onClose,
    onSubmit,
}: {
    initialData?: FormPemeliharaanData | null;
    duplicateData?: FormPemeliharaanModalProps["duplicateData"];
    initialBarang?: BarangSelected | null;
    onClose: () => void;
    onSubmit: (data: FormPemeliharaanData) => void;
}) {
    const defaultBarang = initialData
        ? ({
            kodeBarang: initialData.kodeBarang,
            namaBarang: initialData.namaBarang,
            jumlah: initialData.jumlahTersedia,
            satuan: initialData.satuan,
            asetType: initialData.asetType,
        } as BarangSelected)
        : (initialBarang ?? null);

    // Prioritas pengisian data form: 
    // 1. Data Edit (initialData) -> 2. Data Duplicate (duplicateData) -> 3. Kosong ("")
    const { control, handleSubmit, watch, setValue, clearErrors } = useForm<FormValues>({
        defaultValues: {
            barang: defaultBarang,
            kuasaPenggunaBarang: initialData?.kuasaPenggunaBarang ?? duplicateData?.kuasaPenggunaBarang ?? "",
            program: initialData?.program ?? duplicateData?.program ?? "",
            kegiatan: initialData?.kegiatan ?? duplicateData?.kegiatan ?? "",
            output: initialData?.output ?? duplicateData?.output ?? "",
            namaPemeliharaan: initialData?.namaPemeliharaan ?? "", // Kosongkan saat duplicate
            jumlah: initialData?.jumlah ?? null, // Kosongkan saat duplicate
        },
        mode: "onChange",
    });

    const selectedBarang = watch("barang");
    const currentJumlah = watch("jumlah");
    const isMounted = useRef(false);

    // 2. Reset field 'jumlah' HANYA jika terjadi pergantian barang oleh user.
    // (Mencegah jumlah ter-reset otomatis saat modal Edit baru terbuka)
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
            kodeBarang: data.barang!.kodeBarang,
            namaBarang: data.barang!.namaBarang,
            jumlahTersedia: data.barang!.jumlah, // Jumlah tersedia (Max)
            satuan: data.barang!.satuan,
            asetType: data.barang!.asetType,
            namaPemeliharaan: data.namaPemeliharaan,
            jumlah: data.jumlah!, // Jumlah pengajuan
        });
    };

    return (
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Heading className="text-base font-semibold">
                    {initialData ? "Edit Pemeliharaan" : "Form Pemeliharaan Barang"}
                </Modal.Heading>
                <Description className="text-xs text-foreground/50 mt-0.5">
                    {initialData ? "Ubah data pemeliharaan terpilih" : "Isi data pemeliharaan untuk barang yang dipilih"}
                </Description>
            </Modal.Header>

            <Modal.Body className="max-h-[70vh] overflow-y-auto">
                <form id="form-pemeliharaan" onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Barang <span className="text-danger">*</span>
                        </Label>
                        <Controller
                            control={control}
                            name="barang"
                            rules={{ required: "Pilih barang terlebih dahulu." }}
                            render={({ field, fieldState: { error } }) => (
                                <BarangSelectField
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={error?.message}
                                />
                            )}
                        />
                    </div>

                    {selectedBarang && <BarangCard barang={selectedBarang} jumlahDipakai={currentJumlah ?? 0} />}

                    <SectionLabel>Data Anggaran</SectionLabel>

                    {([
                        { name: "kuasaPenggunaBarang", label: "Kuasa Pengguna Barang", placeholder: "Nama SKPD / unit kerja..." },
                        { name: "program", label: "Program", placeholder: "Nama program..." },
                        { name: "kegiatan", label: "Kegiatan", placeholder: "Nama kegiatan..." },
                        { name: "output", label: "Output", placeholder: "Output kegiatan..." },
                    ] as const).map((fieldInfo) => (
                        <Controller
                            key={fieldInfo.name}
                            control={control}
                            name={fieldInfo.name}
                            rules={{ required: `${fieldInfo.label} wajib diisi.` }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField {...field} isRequired isInvalid={!!error} className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                        {fieldInfo.label} <span className="text-danger ml-0.5">*</span>
                                    </Label>
                                    <Input placeholder={fieldInfo.placeholder} />
                                    {error && <p className="text-[11px] text-danger font-medium mt-0.5">{error.message}</p>}
                                </TextField>
                            )}
                        />
                    ))}

                    <SectionLabel>Detail Pemeliharaan</SectionLabel>

                    <Controller
                        control={control}
                        name="namaPemeliharaan"
                        rules={{ required: "Nama Pemeliharaan wajib diisi." }}
                        render={({ field, fieldState: { error } }) => (
                            <TextField {...field} isRequired isInvalid={!!error} className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                    Nama Pemeliharaan <span className="text-danger ml-0.5">*</span>
                                </Label>
                                <Input placeholder="Contoh: Pengecatan ulang, Servis berkala..." />
                                {error && <p className="text-[11px] text-danger font-medium mt-0.5">{error.message}</p>}
                            </TextField>
                        )}
                    />

                    <Controller
                        control={control}
                        name="jumlah"
                        rules={{
                            required: "Jumlah wajib diisi.",
                            min: { value: 1, message: "Masukkan angka minimal 1." },
                            validate: (value) => {
                                if (!selectedBarang) return "Pilih barang terlebih dahulu.";
                                if (value !== null && value > selectedBarang.jumlah) {
                                    return `Harus tidak lebih dari ketersediaan (${selectedBarang.jumlah} ${selectedBarang.satuan}).`;
                                }
                                return true;
                            },
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
                                    Jumlah <span className="text-danger ml-0.5">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <NumberField.Group className="flex-1">
                                        <NumberField.DecrementButton />
                                        <NumberField.Input />
                                        <NumberField.IncrementButton />
                                    </NumberField.Group>
                                    <span className="text-sm text-foreground/50 font-medium shrink-0 min-w-[36px]">
                                        {selectedBarang?.satuan ?? "—"}
                                    </span>
                                </div>
                                {selectedBarang && !error && (
                                    <Description className="text-xs text-foreground/40 mt-1">
                                        Maksimal {selectedBarang.jumlah} {selectedBarang.satuan}
                                    </Description>
                                )}
                                {error && (
                                    <p className="text-[11px] text-danger font-medium mt-0.5">{error.message}</p>
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
                <Button size="sm" type="submit" form="form-pemeliharaan">
                    Simpan
                </Button>
            </Modal.Footer>
        </Modal.Dialog>
    );
}

export default function FormPemeliharaanModal({
    open,
    initialData,
    duplicateData, // 1. TANGKAP PROP DUPLICATE DI SINI
    initialBarang,
    onClose,
    onSubmit,
}: FormPemeliharaanModalProps) {
    const state = useOverlayState({
        isOpen: open,
        onOpenChange: (isOpen) => { if (!isOpen) onClose(); },
    });

    // 2. BUAT KEY GENERATOR
    // Memaksa React untuk me-remount form (mengulang defaultValues) setiap kali tombol Duplicate/Edit/Add ditekan
    const getModalKey = () => {
        if (!open) return "closed";
        if (initialData) return `edit-${initialData.kodeBarang}-${initialData.namaPemeliharaan}`;
        if (duplicateData) return `dup-${duplicateData.program}-${Date.now()}`;
        return `new-${Date.now()}`;
    };

    return (
        <Modal state={state}>
            <Modal.Backdrop>
                <Modal.Container>
                    <ModalInner
                        key={getModalKey()} // 3. GUNAKAN KEY BARU
                        initialData={initialData}
                        duplicateData={duplicateData} // 4. PASSING DATA KE DALAM FORM
                        initialBarang={initialBarang}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}