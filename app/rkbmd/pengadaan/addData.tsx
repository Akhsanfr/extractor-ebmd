"use client";

import { Autocomplete, ListBox, SearchField, useFilter } from "@heroui/react";
import programData from "../program.json";
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
import type { Barang } from "@/types/bmd";
import { AvailableKodeBarang } from "./availableKodeBarang";
import { FormPengadaan, ListPengadaan } from "@/types/rkbmd";
import { Key, useMemo } from "react";

export type { AsetType } from "@/types/bmd";

export interface FormPengadaaModal {
    isPenggunaBarang: boolean;
    open: boolean;
    initialData: FormPengadaan;
    onClose: () => void;
    onSubmit: (data: ListPengadaan) => void;
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

function BarangCard({ barang }: { barang: Barang }) {
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
    isPenggunaBarang,
    onClose,
    onSubmit,
}: FormPengadaaModal) {
  const {contains} = useFilter({sensitivity: "base"});

    const { control, handleSubmit, watch, setValue, getValues } = useForm<FormPengadaan>({
        defaultValues: initialData
    })

    // 1. Pantau nilai program yang dipilih pengguna
    const selectedProgram = watch("program");

    // 2. Ekstrak dan jadikan daftar program unik (hilangkan duplikat)
    const uniquePrograms = useMemo(() => {
        const programs = programData.map((item) => item.PROGRAM);
        return Array.from(new Set(programs));
    }, []);

    // 3. Filter daftar kegiatan agar sesuai dengan program yang dipilih
    const filteredKegiatan = useMemo(() => {
        if (!selectedProgram) return [];
        return programData
            .filter((item) => item.PROGRAM === selectedProgram)
            .map((item) => item.KEGIATAN);
    }, [selectedProgram]);

    const onValidSubmit = (data: FormPengadaan | null) => {
        if (!data) {
            return;
        }
        if (!data.bmdBisaDioptimalkan) {
            return;
        }
        const jumlahBmdBisaDioptimalkan = data.bmdBisaDioptimalkan?.jumlah ?? 0;
        const jumlahKebutuhanRiil = data.kebutuhanRiil?.jumlah ?? 0;

        onSubmit({
            penggunaBarang: data.penggunaBarang,
            kuasaPenggunaBarang: data.kuasaPenggunaBarang,
            program: data.program,
            kegiatan: data.kegiatan,
            output: data.output,
            usulan: { ...data.bmdBisaDioptimalkan, jumlah: jumlahKebutuhanRiil + jumlahBmdBisaDioptimalkan },
            bmdBisaDioptimalkan: data.bmdBisaDioptimalkan,
            kebutuhanRiil: {
                jumlah: jumlahKebutuhanRiil,
                satuan: data.bmdBisaDioptimalkan?.satuan ?? "",
            },
        });
    };

    const bmdBisaDioptimalkan = watch("bmdBisaDioptimalkan")
    return (
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Heading className="text-base font-semibold">
                    {initialData ? "Edit Usulan Pengadaan" : "Tambah Usulan Pengadaan"}
                </Modal.Heading>
                <Description className="text-xs text-foreground/50 mt-0.5">
                    {initialData
                        ? "Ubah data usulan pengadaan"
                        : "Isi usulan pengadaan baru berdasarkan kode barang"}
                </Description>
            </Modal.Header>

            <Modal.Body className="p-2">
                <form
                    id="form-pengadaan"
                    onSubmit={handleSubmit(onValidSubmit)}
                    className="flex flex-col gap-4 py-2"
                >
                    {/* ── Pilih Barang dari Kamus ── */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Kode Barang <span className="text-danger">*</span>
                        </Label>
                        <AvailableKodeBarang
                            value={getValues("bmdBisaDioptimalkan")}
                            onChange={(value) => {
                                setValue("bmdBisaDioptimalkan", value)
                            }}
                        />
                    </div>

                    {
                        bmdBisaDioptimalkan &&
                        <BarangCard barang={bmdBisaDioptimalkan} />
                    }
                    <SectionLabel>Data Anggaran</SectionLabel>
                    
                                     {([
    {
        name: "penggunaBarang" as const,
        isReadOnly: true,
        isRequired: true,
        label: "Pengguna Barang",
        placeholder: "Dinas/Badan/Kecamatan",
    },
    {
        name: "kuasaPenggunaBarang" as const,
        isRequired: false,
        isReadOnly: !isPenggunaBarang,
        label: "Kuasa Pengguna Barang",
        placeholder: "UPT/Puskesmas/Sekolah/Bagian ...",
    },
    {
        name: "program" as const,
        isRequired: true,
        isReadOnly: false,
        label: "Program",
        placeholder: "Pilih Program ...", 
    },
    {
        name: "kegiatan" as const,
        isRequired: true,
        isReadOnly: false,
        label: "Kegiatan",
        placeholder: "Pilih Kegiatan ...", 
    },
    {
        name: "output" as const,
        isRequired: true,
        isReadOnly: false,
        label: "Output",
        placeholder: "Terlaksananya ...",
    },
]).map((fieldInfo) => (
    <Controller
        key={fieldInfo.name}
        control={control}
        name={fieldInfo.name}
        rules={{ required: fieldInfo.isRequired ? `${fieldInfo.label} wajib diisi.` : false }}
        render={({ field: { ref, value, onChange, ...fieldProps }, fieldState: { error } }) => {
            
            // 1. Render khusus untuk field "program" dengan Anatomi HeroUI
            if (fieldInfo.name === "program") {
                return (
                    <Autocomplete
                        {...fieldProps}
                        placeholder={fieldInfo.placeholder}
                        defaultValue={value || null} // Mencegah undefined
                        onChange={(key) => {
                            onChange(key);
                            setValue("kegiatan", ""); // Reset kegiatan saat program diganti
                        }}
                        className="flex flex-col gap-1.5"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            {fieldInfo.label}
                            {fieldInfo.isRequired && <span className="text-danger ml-0.5">*</span>}
                        </Label>

                        <Autocomplete.Trigger>
                            {/* Menempatkan placeholder di Value agar tampil saat kosong */}
                            <Autocomplete.Value  />
                            <Autocomplete.ClearButton />
                            <Autocomplete.Indicator />
                        </Autocomplete.Trigger>

                        {/* Menampilkan Error jika validasi RHF gagal */}
                        {error && <Description className="text-[11px] text-danger font-medium mt-0.5">{error.message}</Description>}

                        <Autocomplete.Popover>
                            <Autocomplete.Filter filter={contains}>
                                <SearchField>
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder="Ketik untuk mencari program..." />
                                    </SearchField.Group>
                                </SearchField>
                                <ListBox>
                                    {uniquePrograms.map((prog) => (
                                        // Property id wajib untuk Autocomplete/ListBox mengenali value (standar React Aria)
                                        <ListBox.Item key={prog} id={prog} textValue={prog}>
                                            <Label>{prog}</Label>
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Autocomplete.Filter>
                        </Autocomplete.Popover>
                    </Autocomplete>
                );
            }

            // 2. Render khusus untuk field "kegiatan" dengan Anatomi HeroUI
            if (fieldInfo.name === "kegiatan") {
                return (
                    <Autocomplete
                        {...fieldProps}
                        placeholder={fieldInfo.placeholder}
                        defaultValue={value || null}
                        onChange={onChange}
                        isDisabled={!selectedProgram} // Mengunci input jika program belum dipilih
                        className="flex flex-col gap-1.5"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            {fieldInfo.label}
                            {fieldInfo.isRequired && <span className="text-danger ml-0.5">*</span>}
                        </Label>

                        <Autocomplete.Trigger>
                            <Autocomplete.Value  />
                            <Autocomplete.ClearButton />
                            <Autocomplete.Indicator />
                        </Autocomplete.Trigger>

                        {error && <Description className="text-[11px] text-danger font-medium mt-0.5">{error.message}</Description>}

                        <Autocomplete.Popover>
                            <Autocomplete.Filter filter={contains}>
                                <SearchField>
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder="Ketik untuk mencari kegiatan..." />
                                    </SearchField.Group>
                                </SearchField>
                                <ListBox>
                                    {filteredKegiatan.map((keg) => (
                                        <ListBox.Item key={keg} id={keg} textValue={keg}>
                                            <Label>{keg}</Label>
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Autocomplete.Filter>
                        </Autocomplete.Popover>
                    </Autocomplete>
                );
            }

            // 3. Render default untuk TextField (penggunaBarang, kuasaPenggunaBarang, output)
            return (
                <TextField
                    {...fieldProps}
                    value={value || ""}
                    onChange={onChange} // <--- TAMBAHKAN BARIS INI
                    isReadOnly={fieldInfo.isReadOnly}
                    isRequired={fieldInfo.isRequired}
                    isInvalid={!!error}
                    className="flex flex-col gap-1.5"
                >
                    <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        {fieldInfo.label}
                        {fieldInfo.isRequired && <span className="text-danger ml-0.5">*</span>}
                    </Label>

                    <Input ref={ref} placeholder={fieldInfo.placeholder} />

                    {error && <p className="text-[11px] text-danger font-medium mt-0.5">{error.message}</p>}
                </TextField>
            );
        }}
    />
))}

                    <SectionLabel>Usulan Pengadaan</SectionLabel>

                    {/* ── Jumlah Usulan ── */}
                    <Controller
                        control={control}
                        name="kebutuhanRiil.jumlah"
                        rules={{
                            required: "Jumlah wajib diisi.",
                            min: { value: 1, message: "Masukkan angka minimal 1." },
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <>
                                <NumberField
                                    name={field.name}
                                    isRequired
                                    isDisabled={!bmdBisaDioptimalkan}
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
                                            {bmdBisaDioptimalkan?.satuan ?? "—"}
                                        </span>
                                    </div>
                                    {error && (
                                        <p className="text-[11px] text-danger font-medium mt-0.5">
                                            {error.message}
                                        </p>
                                    )}
                                </NumberField>
                                {/* {bmdPreview && (
                                    <p className="text-xs text-warning-600 mt-2">
                                        Stok tersedia: {bmdPreview.jumlah} {bmdPreview.satuan}.
                                        Kebutuhan riil: {Math.max(0, (jumlahUsulan ?? 0) - bmdPreview.jumlah)}
                                    </p>
                                )} */}
                            </>
                        )}
                    />
                </form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="ghost" onPress={onClose}>
                    Batal
                </Button>
                <Button type="submit" form="form-pengadaan">
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
    isPenggunaBarang,
    onClose,
    onSubmit,
}: FormPengadaaModal) {
    const state = useOverlayState({
        isOpen: open,
        onOpenChange: (isOpen) => {
            if (!isOpen) onClose();
        },
    });

    const getModalKey = () => {
        if (!open) return "closed";
        if (initialData)
            return `edit-${initialData.program}`;
        // if (duplicateData) return `dup-${duplicateData.program}-${Date.now()}`;
        return `new-${Date.now()}`;
    };

    return (
        <Modal state={state}>
            <Modal.Backdrop>
                <Modal.Container>
                    <ModalInner
                        isPenggunaBarang={isPenggunaBarang}
                        open={open}
                        key={getModalKey()}
                        initialData={initialData}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}