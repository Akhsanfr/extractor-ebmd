"use client";

import { useEffect, useState } from "react";
import {
    Button,
    Description,
    FieldError,
    Form,
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
import type { AsetType, BarangAll } from "@/types/bmd";

// ─── Types ────────────────────────────────────────────────────────────────────

// BarangSelected is just BarangAll aliased for clarity in this form context
export type { AsetType } from "@/types/bmd";
export type BarangSelected = BarangAll;

export interface FormPemeliharaanData {
    // Anggaran
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    // Dari row terpilih
    kodeBarang: string;
    namaBarang: string;
    jumlahTersedia: number;
    satuan: string;
    asetType: AsetType;
    // Pemeliharaan
    namaPemeliharaan: string;
    jumlah: number;
}

export interface FormPemeliharaanModalProps {
    open: boolean;
    initialBarang?: BarangSelected | null;
    onClose: () => void;
    onSubmit: (data: FormPemeliharaanData) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 my-1">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-foreground/40 uppercase tracking-widest whitespace-nowrap">
                {children}
            </span>
            <Separator className="flex-1" />
        </div>
    );
}

// ─── BarangCard — preview barang terpilih + progress ─────────────────────────

function BarangCard({
    barang,
    jumlahDipakai,
}: {
    barang: BarangSelected;
    jumlahDipakai: number;
}) {
    const valid = jumlahDipakai > 0 && jumlahDipakai <= barang.jumlah;
    const pct = valid ? (jumlahDipakai / barang.jumlah) * 100 : 0;

    return (
        <Surface className="rounded-xl px-4 py-3 flex flex-col gap-2">
            {/* Nama & kode */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {barang.namaBarang}
                    </p>
                    <p className="text-xs font-mono text-foreground/50 mt-0.5">
                        {barang.kodeBarang}
                    </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap shrink-0">
                    {ASET_LABEL[barang.asetType]}
                </span>
            </div>

            {/* Jumlah tersedia */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/50">Jumlah tersedia</span>
                <span className="font-semibold">
                    {barang.jumlah} {barang.satuan}
                </span>
            </div>

            {/* Progress bar — tampil kalau jumlah valid */}
            {valid && (
                <>
                    <div className="h-1.5 w-full rounded-full bg-default-200 overflow-hidden">
                        <div
                            className={[
                                "h-full rounded-full transition-all duration-300",
                                pct > 90
                                    ? "bg-danger"
                                    : pct > 60
                                        ? "bg-warning"
                                        : "bg-success",
                            ].join(" ")}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-xs text-foreground/40 text-right">
                        {jumlahDipakai} dari {barang.jumlah} {barang.satuan}{" "}
                        ({pct.toFixed(0)}%)
                    </p>
                </>
            )}
        </Surface>
    );
}

// ─── ModalInner — semua state & hooks, tidak ada conditional return ────────────

function ModalInner({
    initialBarang,
    onClose,
    onSubmit,
}: {
    initialBarang?: BarangSelected | null;
    onClose: () => void;
    onSubmit: (data: FormPemeliharaanData) => void;
}) {
    // ── State ──
    const [barang, setBarang] = useState<BarangSelected | null>(
        initialBarang ?? null
    );
    const [kuasaPenggunaBarang, setKuasaPenggunaBarang] = useState("");
    const [program, setProgram] = useState("");
    const [kegiatan, setKegiatan] = useState("");
    const [output, setOutput] = useState("");
    const [namaPemeliharaan, setNamaPemeliharaan] = useState("");
    const [jumlah, setJumlah] = useState<number | null>(null);

    // Validasi errors manual (untuk field barang & jumlah yang custom)
    const [barangError, setBarangError] = useState<string | null>(null);
    const [jumlahError, setJumlahError] = useState<string | null>(null);

    // Reset jumlah & error saat barang berganti
    useEffect(() => {
        setJumlah(null);
        setJumlahError(null);
        setBarangError(null);
    }, [barang?.kodeBarang]);

    // ── Submit ──
    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        let valid = true;

        if (!barang) {
            setBarangError("Pilih barang terlebih dahulu.");
            valid = false;
        } else {
            setBarangError(null);
        }

        if (jumlah === null || jumlah <= 0) {
            setJumlahError("Masukkan angka lebih dari 0.");
            valid = false;
        } else if (barang && jumlah >= barang.jumlah) {
            setJumlahError(
                `Harus kurang dari jumlah tersedia (${barang.jumlah} ${barang.satuan}).`
            );
            valid = false;
        } else {
            setJumlahError(null);
        }

        if (!valid || !barang || jumlah === null) return;

        onSubmit({
            kuasaPenggunaBarang,
            program,
            kegiatan,
            output,
            kodeBarang: barang.kodeBarang,
            namaBarang: barang.namaBarang,
            jumlahTersedia: barang.jumlah,
            satuan: barang.satuan,
            asetType: barang.asetType,
            namaPemeliharaan,
            jumlah,
        });
    }

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

            <Modal.Body>
                <Form
                    id="form-pemeliharaan"
                    onSubmit={handleFormSubmit}
                    validationBehavior="aria"
                    className="flex flex-col gap-4"
                >
                    {/* ── Pilih Barang ── */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Barang{" "}
                            <span className="text-danger">*</span>
                        </Label>
                        <BarangSelectField
                            value={barang}
                            onChange={setBarang}
                            error={barangError ?? undefined}
                        />
                    </div>

                    {/* ── Preview barang terpilih ── */}
                    {barang && (
                        <BarangCard
                            barang={barang}
                            jumlahDipakai={jumlah ?? 0}
                        />
                    )}

                    <SectionLabel>Data Anggaran</SectionLabel>

                    {/* ── Kuasa Pengguna Barang ── */}
                    <TextField
                        name="kuasaPenggunaBarang"
                        isRequired
                        value={kuasaPenggunaBarang}
                        onChange={setKuasaPenggunaBarang}
                        className="flex flex-col gap-1"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Kuasa Pengguna Barang
                            <span className="text-danger ml-0.5">*</span>
                        </Label>
                        <Input placeholder="Nama SKPD / unit kerja..." />
                        <FieldError className="text-xs text-danger" />
                    </TextField>

                    {/* ── Program ── */}
                    <TextField
                        name="program"
                        isRequired
                        value={program}
                        onChange={setProgram}
                        className="flex flex-col gap-1"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Program
                            <span className="text-danger ml-0.5">*</span>
                        </Label>
                        <Input placeholder="Nama program..." />
                        <FieldError className="text-xs text-danger" />
                    </TextField>

                    {/* ── Kegiatan ── */}
                    <TextField
                        name="kegiatan"
                        isRequired
                        value={kegiatan}
                        onChange={setKegiatan}
                        className="flex flex-col gap-1"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Kegiatan
                            <span className="text-danger ml-0.5">*</span>
                        </Label>
                        <Input placeholder="Nama kegiatan..." />
                        <FieldError className="text-xs text-danger" />
                    </TextField>

                    {/* ── Output ── */}
                    <TextField
                        name="output"
                        isRequired
                        value={output}
                        onChange={setOutput}
                        className="flex flex-col gap-1"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Output
                            <span className="text-danger ml-0.5">*</span>
                        </Label>
                        <Input placeholder="Output kegiatan..." />
                        <FieldError className="text-xs text-danger" />
                    </TextField>

                    <SectionLabel>Detail Pemeliharaan</SectionLabel>

                    {/* ── Nama Pemeliharaan ── */}
                    <TextField
                        name="namaPemeliharaan"
                        isRequired
                        value={namaPemeliharaan}
                        onChange={setNamaPemeliharaan}
                        className="flex flex-col gap-1"
                    >
                        <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                            Nama Pemeliharaan
                            <span className="text-danger ml-0.5">*</span>
                        </Label>
                        <Input placeholder="Contoh: Pengecatan ulang, Servis berkala..." />
                        <FieldError className="text-xs text-danger" />
                    </TextField>

                    {/* ── Jumlah — harus < jumlah tersedia ── */}
                    <div className="flex flex-col gap-1">
                        <NumberField
                            name="jumlah"
                            isRequired
                            isDisabled={!barang}
                            minValue={1}
                            value={jumlah ?? undefined}
                            onChange={(v) => setJumlah(isNaN(v) ? null : v)}
                            className="flex flex-col gap-1"
                        >
                            <Label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                Jumlah
                                <span className="text-danger ml-0.5">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <NumberField.Group className="flex-1">
                                    <NumberField.DecrementButton />
                                    <NumberField.Input />
                                    <NumberField.IncrementButton />
                                </NumberField.Group>
                                <span className="text-sm text-foreground/50 font-medium shrink-0 min-w-[36px]">
                                    {barang?.satuan ?? "—"}
                                </span>
                            </div>
                            {barang && !jumlahError && (
                                <Description className="text-xs text-foreground/40">
                                    Harus kurang dari {barang.jumlah}{" "}
                                    {barang.satuan}
                                </Description>
                            )}
                            <FieldError className="text-xs text-danger" />
                        </NumberField>

                        {/* Error manual untuk validasi "< jumlah tersedia" */}
                        {jumlahError && (
                            <p className="text-xs text-danger">{jumlahError}</p>
                        )}
                    </div>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="ghost"
                    size="sm"
                    onPress={onClose}
                >
                    Batal
                </Button>
                <Button
                    size="sm"
                    type="submit"
                    form="form-pemeliharaan"
                >
                    Simpan
                </Button>
            </Modal.Footer>
        </Modal.Dialog>
    );
}

// ─── FormPemeliharaanModal — shell, hanya urus open state ─────────────────────

export default function FormPemeliharaanModal({
    open,
    initialBarang,
    onClose,
    onSubmit,
}: FormPemeliharaanModalProps) {
    // HeroUI v3: Modal dikontrol via useOverlayState, bukan isOpen prop langsung
    const state = useOverlayState({
        isOpen: open,
        onOpenChange: (isOpen) => { if (!isOpen) onClose(); },
    });

    return (
        <Modal state={state}>
            <Modal.Backdrop>
                <Modal.Container>
                    <ModalInner
                        key={open ? (initialBarang?.kodeBarang ?? "new") : "closed"}
                        initialBarang={initialBarang}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}