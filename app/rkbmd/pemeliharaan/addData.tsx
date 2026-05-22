"use client";

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
import { BarangSelectField } from "@/component/barangSelectField";
import { ASET_LABEL } from "@/types/bmd";
import type { Barang } from "@/types/bmd";
import { FormPemeliharan, ListPemeliharaan } from "@/types/rkbmd";

export interface FormPemeliharaanModalProps {
    isPenggunaBarang: boolean;
    open: boolean;
    initialData: FormPemeliharan;
    onClose: () => void;
    onSubmit: (data: ListPemeliharaan) => void;
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

function BarangCard({ barang, jumlahDipakai }: { barang: Barang; jumlahDipakai: number }) {
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
                    {ASET_LABEL[barang.asetType] ?? barang.asetType}
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
    isPenggunaBarang,
    onClose,
    onSubmit,
}: FormPemeliharaanModalProps) {
    const { control, handleSubmit, watch } = useForm<FormPemeliharan>({
        defaultValues: initialData,
        mode: "onChange",
    });

    const selectedBarang = watch("bmd");
    const currentJumlah = watch("usulanPemeliharaan.jumlah");

    const onValidSubmit = (data: FormPemeliharan) => {
        if (!data.bmd || !data.usulanPemeliharaan) return;

        onSubmit({
            penggunaBarang: data.penggunaBarang,
            kuasaPenggunaBarang: data.kuasaPenggunaBarang,
            program: data.program,
            kegiatan: data.kegiatan,
            output: data.output,
            bmd: data.bmd,
            usulanPemeliharaan: {
                namaPemeliharaan: data.usulanPemeliharaan.namaPemeliharaan,
                jumlah: data.usulanPemeliharaan.jumlah,
                satuan: data.bmd.satuan, // Enforce satuan matches bmd
            },
            keterangan: data.keterangan || "",
        });
    };

    return (
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Heading className="text-base font-semibold">
                    Form Pemeliharaan Barang
                </Modal.Heading>
                <Description className="text-xs text-foreground/50 mt-0.5">
                    Isi data pemeliharaan untuk barang yang dipilih
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
                            name="bmd"
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

                    {(
                        [
                            {
                                name: "penggunaBarang" as const,
                                isReadOnly: true,
                                label: "Pengguna Barang",
                                placeholder: "Dinas/Badan/Kecamatan",
                            },
                            {
                                name: "kuasaPenggunaBarang" as const,
                                isReadOnly: !isPenggunaBarang,
                                label: "Kuasa Pengguna Barang",
                                placeholder: "UPT/Puskesmas/Sekolah/Bagian ...",
                            },
                            {
                                name: "program" as const,
                                isReadOnly: false,
                                label: "Program",
                                placeholder: "Program ...",
                            },
                            {
                                name: "kegiatan" as const,
                                isReadOnly: false,
                                label: "Kegiatan",
                                placeholder: "Kegiatan ...",
                            },
                            {
                                name: "output" as const,
                                isReadOnly: false,
                                label: "Output",
                                placeholder: "Terlaksananya ...",
                            },
                        ]
                    ).map((fieldInfo) => (
                        <Controller
                            key={fieldInfo.name}
                            control={control}
                            name={fieldInfo.name}
                            rules={{ required: `${fieldInfo.label} wajib diisi.` }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField {...field} isReadOnly={fieldInfo.isReadOnly} isRequired isInvalid={!!error} className="flex flex-col gap-1.5">
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
                        name="usulanPemeliharaan.namaPemeliharaan"
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
                        name="usulanPemeliharaan.jumlah"
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
                    
                    <Controller
                        control={control}
                        name="keterangan"
                        render={({ field, fieldState: { error } }) => (
                            <TextField {...field} isInvalid={!!error} className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                    Keterangan
                                </Label>
                                <Input placeholder="Opsional" />
                                {error && <p className="text-[11px] text-danger font-medium mt-0.5">{error.message}</p>}
                            </TextField>
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
    isPenggunaBarang,
    open,
    initialData,
    onClose,
    onSubmit,
}: FormPemeliharaanModalProps) {
    const state = useOverlayState({
        isOpen: open,
        onOpenChange: (isOpen) => { if (!isOpen) onClose(); },
    });

    const getModalKey = () => {
        if (!open) return "closed";
        return `modal-${Date.now()}`;
    };

    return (
        <Modal state={state}>
            <Modal.Backdrop>
                <Modal.Container>
                    <ModalInner
                        key={getModalKey()}
                        isPenggunaBarang={isPenggunaBarang}
                        open={open}
                        initialData={initialData}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}