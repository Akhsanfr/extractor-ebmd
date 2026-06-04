"use client";

import { useRef, useState } from "react";
import {
    Modal,
    Button,
    toast,
} from "@heroui/react";
import * as XLSX from "xlsx";
import { upsertFromExcelAction } from "@/action/sebaranBmd/sebaranBmd.action";
import type { UpsertExcelResult } from "@/action/sebaranBmd/sebaranBmd.contract";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// ─── Konstanta ────────────────────────────────────────────────────────────────

const REQUIRED_HEADERS = ["nibar", "pic"] as const;
const OPTIONAL_HEADERS = ["hak", "nomor", "desa", "nibel"] as const;
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
const MAX_FILE_MB = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateHeaders(headers: string[]): { valid: boolean; missing: string[] } {
    const lower = headers.map((h) => h.toLowerCase().trim());
    const missing = REQUIRED_HEADERS.filter((r) => !lower.includes(r));
    return { valid: missing.length === 0, missing };
}

function formatResult(r: UpsertExcelResult): string {
    const parts = [`${r.inserted} data baru`, `${r.updated} diperbarui`];
    if (r.skipped > 0) parts.push(`${r.skipped} dilewati`);
    return parts.join(", ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadExcelModal({ isOpen, onClose, onSuccess }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [rowCount, setRowCount] = useState<number | null>(null);
    const [parsedRows, setParsedRows] = useState<Record<string, unknown>[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resultErrors, setResultErrors] = useState<string[]>([]);

    // ── File selection & parsing ──────────────────────────────────────────────

    function handleClickUpload() {
        fileRef.current?.click();
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset state
        setError(null);
        setResultErrors([]);
        setParsedRows(null);
        setFileName(null);
        setRowCount(null);

        // Validasi ekstensi
        const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
        if (!isExcel) {
            setError("Hanya file .xlsx atau .xls yang diterima.");
            e.target.value = "";
            return;
        }

        // Validasi ukuran
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            setError(`Ukuran file melebihi ${MAX_FILE_MB} MB.`);
            e.target.value = "";
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rawParsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
                defval: null,   // kolom kosong → null bukan undefined
                raw: false,     // semua nilai jadi string
            });

            // SheetJS menghasilkan object dengan prototype non-plain.
            // Next.js Server Actions hanya menerima plain object — sanitize dulu.
            const rows = rawParsed.map((r) => Object.assign({}, r));

            if (rows.length === 0) {
                setError("Sheet pertama tidak memiliki data.");
                e.target.value = "";
                return;
            }

            // Validasi header
            const firstRowKeys = Object.keys(rows[0]);
            const { valid, missing } = validateHeaders(firstRowKeys);
            if (!valid) {
                setError(`Kolom wajib tidak ditemukan: ${missing.join(", ")}. Pastikan baris pertama adalah header.`);
                e.target.value = "";
                return;
            }

            setParsedRows(rows);
            setFileName(file.name);
            setRowCount(rows.length);
        } catch {
            setError("Gagal membaca file Excel. Pastikan file tidak rusak.");
        } finally {
            e.target.value = "";
        }
    }

    // ── Upload to server ──────────────────────────────────────────────────────

    async function handleUpload() {
        if (!parsedRows) return;
        setLoading(true);
        setResultErrors([]);
        try {
            const result = await upsertFromExcelAction(parsedRows);
            if (result.success) {
                toast.success(`Berhasil: ${formatResult(result)}`);
                if (result.errors.length > 0) {
                    setResultErrors(result.errors);
                    // Biarkan modal tetap terbuka agar user bisa lihat error baris
                } else {
                    onSuccess();
                    handleClose();
                }
            } else {
                const mainError = result.errors[0] ?? "Terjadi kesalahan.";
                toast.danger(mainError);
                setResultErrors(result.errors);
            }
        } catch {
            toast.danger("Terjadi kesalahan tak terduga.");
        } finally {
            setLoading(false);
        }
    }

    // ── Reset & close ─────────────────────────────────────────────────────────

    function handleClear() {
        setParsedRows(null);
        setFileName(null);
        setRowCount(null);
        setError(null);
        setResultErrors([]);
    }

    function handleClose() {
        handleClear();
        onClose();
    }

    // ── Template download ─────────────────────────────────────────────────────

    function handleDownloadTemplate() {
        const ws = XLSX.utils.aoa_to_sheet([ALL_HEADERS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "template-sebaran-bmd.xlsx");
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger onPress={handleClose} />

                        <Modal.Header>
                            <Modal.Heading>Import Data via Excel</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="gap-4">
                            {/* Info kolom */}
                            <div className="rounded-lg bg-default-50 border border-default-200 px-3 py-2 flex flex-col gap-1">
                                <p className="text-xs font-semibold text-default-600">Kolom yang dikenali</p>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {REQUIRED_HEADERS.map((h) => (
                                        <span
                                            key={h}
                                            className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-mono"
                                        >
                                            {h} *
                                        </span>
                                    ))}
                                    {OPTIONAL_HEADERS.map((h) => (
                                        <span
                                            key={h}
                                            className="text-xs px-2 py-0.5 rounded-full bg-default-100 text-default-600 font-mono"
                                        >
                                            {h}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-default-400 mt-0.5">* wajib diisi</p>
                            </div>

                            {/* Tombol aksi */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onPress={handleClickUpload}
                                    isDisabled={loading}
                                >
                                    Pilih File Excel
                                </Button>
                                <Button
                                    variant="ghost"
                                    onPress={handleDownloadTemplate}
                                    isDisabled={loading}
                                >
                                    Unduh Template
                                </Button>
                            </div>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                ref={fileRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Error validasi file */}
                            {error && (
                                <p className="text-sm text-danger">{error}</p>
                            )}

                            {/* Preview file siap upload */}
                            {parsedRows && fileName && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-success-50 border border-success-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-success-600">✓</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-success-700">{fileName}</span>
                                            <span className="text-xs text-success-500">
                                                {rowCount?.toLocaleString("id-ID")} baris data ditemukan
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="danger-soft"
                                        onPress={handleClear}
                                        isDisabled={loading}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            )}

                            {/* Error per-baris setelah upload */}
                            {resultErrors.length > 0 && (
                                <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 flex flex-col gap-1 max-h-40 overflow-y-auto">
                                    <p className="text-xs font-semibold text-warning-700">
                                        {resultErrors.length} baris dilewati:
                                    </p>
                                    {resultErrors.slice(0, 20).map((msg, i) => (
                                        <p key={i} className="text-xs text-warning-600">
                                            • {msg}
                                        </p>
                                    ))}
                                    {resultErrors.length > 20 && (
                                        <p className="text-xs text-warning-500 italic">
                                            … dan {resultErrors.length - 20} pesan lainnya.
                                        </p>
                                    )}
                                </div>
                            )}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="outline" onPress={handleClose} isDisabled={loading}>
                                Batal
                            </Button>
                            <Button
                                onPress={handleUpload}
                                isPending={loading}
                                isDisabled={!parsedRows}
                            >
                                Import
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}