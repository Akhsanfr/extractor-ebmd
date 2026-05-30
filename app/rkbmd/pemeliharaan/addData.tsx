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
    TextArea,
    TextField,
    useOverlayState,
} from "@heroui/react";
import { BarangSelectField } from "@/component/barangSelectField";
import { FormPemeliharan, ListPemeliharaan } from "@/types/rkbmd";
import { AvailablePerangkatDaerah } from "@/component/availbalePerangkatDaerah";
import { JenisPerangkatDaerah } from "@/types/perangkatDaerah";
import { AvailableProgramDanKegiatan } from "@/component/availableProgramDanKegiatan";

export interface FormPemeliharaanModal {
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



function ModalInner({
    initialData,
    isPenggunaBarang,
    onClose,
    onSubmit,
}: FormPemeliharaanModal) {
    const { control, handleSubmit, watch, setValue } = useForm<FormPemeliharan>({
        defaultValues: initialData,
    });

    const selectedProgram = watch("program");
    const selectedPenggunaBarang = watch("penggunaBarang");
    const bmd = watch("bmd");

    const onValidSubmit = (data: FormPemeliharan) => {
        if (!data.bmd || !data.usulanPemeliharaan) return;

        onSubmit({
            penggunaBarang: data.penggunaBarang,
            kuasaPenggunaBarang: data.kuasaPenggunaBarang,
            program: data.program,
            kegiatan: data.kegiatan,
            output: data.output,
            bmd: data.bmd,
            usulanPemeliharaan: data.usulanPemeliharaan,
            keterangan: data.keterangan,
        });
    };

    return (
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Heading className="text-base font-semibold">
                    {initialData.bmd ? "Edit Rencana Pemeliharaan" : "Tambah Rencana Pemeliharaan"}
                </Modal.Heading>
                <Description className="text-xs text-foreground/50 mt-0.5">
                    {initialData.bmd
                        ? "Ubah data rencana pemeliharaan barang"
                        : "Isi rencana pemeliharaan baru berdasarkan kode barang"}
                </Description>
            </Modal.Header>

            <Modal.Body className="p-2">
                <form
                    id="form-pemeliharaan"
                    onSubmit={handleSubmit(onValidSubmit)}
                    className="flex flex-col gap-4 py-2"
                >
                    {/* ── Pilih Barang dari Database ── */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Barang <span className="text-danger">*</span>
                        </Label>
                        <Controller
                            control={control}
                            name="bmd"
                            rules={{ required: "Barang wajib dipilih." }}
                            render={({ field: { value }, fieldState: { error } }) => (
                                <BarangSelectField
                                    value={value}
                                    onChange={(val) => setValue("bmd", val)}
                                    error={error?.message}
                                />
                            )}
                        />
                    </div>

                    <SectionLabel>Data Anggaran</SectionLabel>

                    <Controller
                        control={control}
                        name="penggunaBarang"
                        rules={{ required: "Pengguna Barang wajib diisi." }}
                        render={({ field: { ref, value }, fieldState: { error } }) => (
                            <AvailablePerangkatDaerah
                                jenis={JenisPerangkatDaerah.penggunaBarang}
                                value={value}
                                onChange={(val) => {
                                    setValue("penggunaBarang", val);
                                    setValue("kuasaPenggunaBarang", "");
                                }}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="kuasaPenggunaBarang"
                        rules={{ required: "Kuasa Pengguna Barang wajib diisi." }}
                        render={({ field: { ref, value, onChange } }) => (
                            <AvailablePerangkatDaerah
                                jenis={JenisPerangkatDaerah.kuasaPenggunaBarang}
                                value={value}
                                parentPenggunaBarang={selectedPenggunaBarang}
                                onChange={onChange}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="program"
                        rules={{ required: "Program wajib diisi." }}
                        render={({ field: { ref, value } }) => (
                            <AvailableProgramDanKegiatan
                                jenis="program"
                                value={value}
                                onChange={(val) => {
                                    setValue("program", val);
                                    setValue("kegiatan", "");
                                }}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="kegiatan"
                        rules={{ required: "Kegiatan wajib diisi." }}
                        render={({ field: { ref, value } }) => (
                            <AvailableProgramDanKegiatan
                                jenis="kegiatan"
                                value={value}
                                parentProgram={selectedProgram}
                                onChange={(val) => setValue("kegiatan", val)}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="output"
                        rules={{ required: "Output wajib diisi." }}
                        render={({ field: { ref, value, onChange, ...fieldProps }, fieldState: { error } }) => (
                            <TextField
                                {...fieldProps}
                                value={value || ""}
                                onChange={onChange}
                                isInvalid={!!error}
                                className="flex flex-col gap-1.5"
                            >
                                <Label>
                                    Output
                                    <span className="text-danger ml-0.5">*</span>
                                </Label>
                                <Input ref={ref} placeholder="Masukkan output" />
                                {error && (
                                    <p className="text-[11px] text-danger font-medium mt-0.5">
                                        {error.message}
                                    </p>
                                )}
                            </TextField>
                        )}
                    />

                    <SectionLabel>Rencana Pemeliharaan</SectionLabel>

                    {/* ── Nama Pemeliharaan ── */}
                    <Controller
                        control={control}
                        name="usulanPemeliharaan.namaPemeliharaan"
                        rules={{ required: "Nama pemeliharaan wajib diisi." }}
                        render={({ field: { ref, value, onChange, ...fieldProps }, fieldState: { error } }) => (
                            <TextField
                                {...fieldProps}
                                value={value || ""}
                                onChange={onChange}
                                isInvalid={!!error}
                                className="flex flex-col gap-1.5"
                            >
                                <Label>
                                    Nama Pemeliharaan
                                    <span className="text-danger ml-0.5">*</span>
                                </Label>
                                <Input ref={ref} placeholder="Contoh: Servis berkala, Pengecatan" />
                                {error && (
                                    <p className="text-[11px] text-danger font-medium mt-0.5">
                                        {error.message}
                                    </p>
                                )}
                            </TextField>
                        )}
                    />

                    {/* ── Jumlah ── */}
                    <Controller
                        control={control}
                        name="usulanPemeliharaan.jumlah"
                        rules={{
                            required: "Jumlah wajib diisi.",
                            min: { value: 1, message: "Masukkan angka minimal 1." },
                            validate: (value) => {
                                if (!bmd) return "Pilih barang terlebih dahulu.";
                                if (value !== null && value > bmd.jumlah) {
                                    return `Harus tidak lebih dari ketersediaan (${bmd.jumlah} ${bmd.satuan}).`;
                                }
                                return true;
                            },
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <NumberField
                                name={field.name}
                                isRequired
                                isDisabled={!bmd}
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
                                    <span className="text-sm text-foreground/50 font-medium shrink-0 min-w-[40px]">
                                        {bmd?.satuan ?? "—"}
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

                    {/* ── Keterangan ── */}
                    <Controller
                        control={control}
                        name="keterangan"
                        render={({ field: { ref, value, onChange, ...fieldProps } }) => (
                            <TextField
                                {...fieldProps}
                                value={value || ""}
                                onChange={onChange}
                                className="flex flex-col gap-1.5"
                            >
                                <Label>Keterangan</Label>
                                <TextArea
                                    ref={ref}
                                    placeholder="Catatan tambahan (opsional)"
                                    className="min-h-[72px] resize-none"
                                />
                            </TextField>
                        )}
                    />
                </form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="ghost" onPress={onClose}>
                    Batal
                </Button>
                <Button type="submit" form="form-pemeliharaan">
                    Simpan Pemeliharaan
                </Button>
            </Modal.Footer>
        </Modal.Dialog>
    );
}

// ─── FormPemeliharaanModal ─────────────────────────────────────────────────────

export default function FormPemeliharaanModal({
    open,
    initialData,
    isPenggunaBarang,
    onClose,
    onSubmit,
}: FormPemeliharaanModal) {
    const state = useOverlayState({
        isOpen: open,
        onOpenChange: (isOpen) => {
            if (!isOpen) onClose();
        },
    });

    const getModalKey = () => {
        if (!open) return "closed";
        if (initialData.bmd) return `edit-${initialData.program}-${initialData.bmd.kodeBarang}`;
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