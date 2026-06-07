"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Chip, Modal, Table } from "@heroui/react";
import { PerangkatDaerahContract } from "@/action/perangkatDaerah/contract";
import {
    getPerangkatDaerahAction,
    upsertManyPerangkatDaerahAction,
} from "@/action/perangkatDaerah/action";
import { Import } from "lucide-react";

type SelectDTO = PerangkatDaerahContract.SelectDTO;
type UploadState = "idle" | "parsed" | "uploading" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JABATAN_COLOR: Record<
    string,
    "default" | "primary" | "secondary" | "success" | "warning" | "danger"
> = {
    "pengguna barang": "primary",
    "kuasa penguna barang": "secondary",
    "sub kuasa penguna barang": "default",
};

function jabatanColor(jabatan: string) {
    return JABATAN_COLOR[jabatan.toLowerCase()] ?? "default";
}

function getIndentLevel(kodeLokasi: string): number {
    const extra = kodeLokasi.split(".").length - 3;
    return extra > 0 ? extra : 0;
}

function parseExcelRows(file: File): Promise<PerangkatDaerahContract.CreateDTO[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
                const parsed: PerangkatDaerahContract.CreateDTO[] = rows
                    .filter((r) => r["Kode Lokasi"] && r["Nama Lokasi"])
                    .map((r) => ({
                        kodeLokasi: String(r["Kode Lokasi"]).trim(),
                        namaLokasi: String(r["Nama Lokasi"]).trim(),
                        jabatan: String(r["Jabatan"] ?? "").trim(),
                    }));
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PerangkatDaerahContract.CreateDTO[]>([]);
    const [state, setState] = useState<UploadState>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const reset = () => {
        setFile(null);
        setPreview([]);
        setState("idle");
        setErrorMsg("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        try {
            const rows = await parseExcelRows(f);
            setPreview(rows);
            setState("parsed");
        } catch {
            setState("error");
            setErrorMsg("Gagal membaca file. Pastikan format Excel benar.");
        }
    };

    const handleSubmit = async () => {
        if (!preview.length) return;
        setState("uploading");
        try {
            const result = await upsertManyPerangkatDaerahAction(preview);
            if (!result.success) {
                setState("error");
                // setErrorMsg(result?.message ?? "Gagal menyimpan data.");
                return;
            }
            setState("done");
            onSuccess();
            setTimeout(handleClose, 800);
        } catch {
            setState("error");
            setErrorMsg("Terjadi kesalahan saat menyimpan.");
        }
    };

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog >
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>Import Perangkat Daerah</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-4">
                            <p className="text-xs text-default-400">
                                Upload file Excel dengan kolom: Kode Lokasi, Nama Lokasi, Jabatan
                            </p>

                            {/* Drop zone */}
                            <div
                                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-default-200 bg-default-50 px-6 py-10 transition hover:border-primary hover:bg-primary-50"
                                onClick={() => inputRef.current?.click()}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 text-default-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="text-sm text-default-500">
                                    {file ? file.name : "Klik untuk pilih file Excel"}
                                </p>
                            </div>

                            {/* Error */}
                            {state === "error" && (
                                <p className="text-sm text-danger">{errorMsg}</p>
                            )}

                            {/* Preview table */}
                            {preview.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs text-default-400">
                                        {preview.length} baris siap diimport
                                    </p>
                                    <Table>
                                        <Table.ScrollContainer>
                                            <Table.Content aria-label="Preview data">
                                                <Table.Header>
                                                    <Table.Column>KODE LOKASI</Table.Column>
                                                    <Table.Column>NAMA LOKASI</Table.Column>
                                                    <Table.Column>JABATAN</Table.Column>
                                                </Table.Header>
                                                <Table.Body>
                                                    {preview.map((row) => (
                                                        <Table.Row key={row.kodeLokasi}>
                                                            <Table.Cell>
                                                                <span className="font-mono text-xs text-default-500">
                                                                    {row.kodeLokasi}
                                                                </span>
                                                            </Table.Cell>
                                                            <Table.Cell className="text-sm">
                                                                {row.namaLokasi}
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                <Chip
                                                                    size="sm"
                                                                // variant="flat"
                                                                // color={jabatanColor(row.jabatan)}
                                                                >
                                                                    {row.jabatan}
                                                                </Chip>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table.Content>
                                        </Table.ScrollContainer>
                                    </Table>
                                </div>
                            )}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                onPress={handleClose}
                                isDisabled={state === "uploading"}
                            >
                                Batal
                            </Button>
                            <Button
                                onPress={handleSubmit}
                                isPending={state === "uploading"}
                                isDisabled={state !== "parsed" || preview.length === 0}
                            >
                                {state === "done" ? "Tersimpan ✓" : "Simpan"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerangkatDaerahPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [data, setData] = useState<SelectDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getPerangkatDaerahAction();
        if (result.success) setData(result.data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = data.filter(
        (d) =>
            d.namaLokasi.toLowerCase().includes(search.toLowerCase()) ||
            d.kodeLokasi.includes(search)
    );

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Perangkat Daerah</h1>
                    <p className="text-sm text-default-400">
                        Daftar unit kerja dan struktur jabatan pengelola barang
                    </p>
                </div>
                <Button
                    onPress={() => setModalOpen(true)}
                >
                    <Import />
                    Import Excel
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Cari kode lokasi atau nama..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-default-200 bg-default-50 px-4 py-2 text-sm text-foreground placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Table */}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Daftar Perangkat Daerah"
                    >
                        <Table.Header>
                            <Table.Column isRowHeader width={160}>KODE LOKASI</Table.Column>
                            <Table.Column>NAMA LOKASI</Table.Column>
                            <Table.Column width={200}>JABATAN</Table.Column>
                        </Table.Header>
                        <Table.Body
                        >
                            {filtered.map((row) => {
                                const indent = getIndentLevel(row.kodeLokasi);
                                return (
                                    <Table.Row key={row.kodeLokasi}>
                                        <Table.Cell>
                                            <span className="font-mono text-xs text-default-500">
                                                {row.kodeLokasi}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span
                                                className="text-sm font-medium"
                                                style={{ paddingLeft: `${indent * 16}px` }}
                                            >
                                                {indent > 0 && (
                                                    <span className="mr-1 text-default-300">└</span>
                                                )}
                                                {row.namaLokasi}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Chip
                                                size="sm"
                                            // color={jabatanColor(row.jabatan)}
                                            >
                                                {row.jabatan}
                                            </Chip>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>

                {!isLoading && (
                    <Table.Footer>
                        <p className="text-xs text-default-400">
                            {filtered.length} dari {data.length} unit kerja
                        </p>
                    </Table.Footer>
                )}
            </Table>

            <UploadModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={load}
            />
        </div>
    );
}