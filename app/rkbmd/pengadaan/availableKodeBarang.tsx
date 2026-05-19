"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Modal, useOverlayState } from "@heroui/react";
import * as XLSX from "xlsx";
import { BarangSelected } from "./addData";

interface ExcelBarangSelectProps {
    value: BarangSelected | null;
    onChange: (value: BarangSelected) => void;
    error?: string;
}

export function AvailableKodeBarang({ value, onChange, error }: ExcelBarangSelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    // ── STATE UNTUK MODAL EXCEL ──
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Load data Excel hanya ketika modal dibuka pertama kali
    useEffect(() => {
        if (isOpen && data.length === 0) {
            const fetchExcel = async () => {
                setLoading(true);
                try {
                    // Pastikan file kodeBarang.xlsx berada di folder public/
                    const response = await fetch("/kodeBarang.xlsx");
                    const arrayBuffer = await response.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Konversi dengan header "A" agar mapping kolom sesuai abjad
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
                    setData(jsonData);
                } catch (error) {
                    console.error("Gagal memuat data excel:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchExcel();
        }
    }, [isOpen, data.length]);

    // Handle Overlay State dari HeroUI
    const state = useOverlayState({
        isOpen: isOpen,
        onOpenChange: setIsOpen,
    });

    // Filter Data berdasarkan pencarian (Mencari di Kolom I / Nama Barang)
    // Lewati baris pertama jika itu adalah header (.slice(1))
    const filteredData = data.slice(1).filter((row) => {
        if (!searchTerm) return true;
        const nama = String(row.I || "").toLowerCase();
        const kode = String(row.H || "").toLowerCase();
        return nama.includes(searchTerm.toLowerCase()) || kode.includes(searchTerm.toLowerCase());
    });

    // Batasi render tabel maksimal 100 baris agar tidak lag jika file excel sangat besar
    const displayData = filteredData.slice(0, 100);

    return (
        <>
            {/* ── TRIGGER FIELD ── */}
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={[
                        "w-full text-left text-sm px-3 py-2 rounded-lg border outline-none transition-all",
                        "bg-default-50 hover:bg-default-100 flex items-center justify-between gap-2",
                        error
                            ? "border-danger"
                            : "border-default-300 hover:border-default-400",
                    ].join(" ")}
                >
                    <span className={value ? "text-foreground truncate" : "text-default-400"}>
                        {value ? `${value.kodeBarang} — ${value.namaBarang}` : "Klik untuk memilih barang dari Excel..."}
                    </span>
                    <span className="text-xs font-medium text-default-500 shrink-0 px-2 py-0.5 rounded bg-default-200">
                        Cari
                    </span>
                </button>
                {error && <p className="text-[11px] text-danger font-medium">{error}</p>}
            </div>

            {/* ── MODAL PILIH BARANG EXCEL ── */}
            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="max-w-5xl max-h-[85vh] flex flex-col">
                            <Modal.Header className="flex flex-col gap-2">
                                <h2 className="text-xl font-bold">Pilih Kode Barang (Excel)</h2>
                                <Input
                                    placeholder="Cari nama barang atau kode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Modal.Header>
                            <Modal.Body className="overflow-y-auto">
                                {loading ? (
                                    <p className="p-4 text-center text-foreground/50">Memuat data Excel...</p>
                                ) : (
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-2 border-b">ID (A)</th>
                                                <th className="p-2 border-b">KODE BARANG (Q)</th>
                                                <th className="p-2 border-b">NAMA (I)</th>
                                                <th className="p-2 border-b text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayData.map((row, index) => {
                                                // VALIDASI: Hanya baris dengan Kolom H terisi yang bisa dipilih
                                                const isKolomHAvailable = row.H !== undefined && row.H !== null && String(row.H).trim() !== "";

                                                return (
                                                    <tr key={index} className="hover:bg-muted/50">
                                                        <td className="p-2 border-b text-foreground/70">{row.A}</td>
                                                        <td className="p-2 border-b text-foreground/70">{row.Q}</td>
                                                        <td className="p-2 border-b">{row.I}</td>
                                                        <td className="p-2 border-b text-center">
                                                            {isKolomHAvailable ? (
                                                                <Button
                                                                    size="sm"
                                                                    onPress={() => {
                                                                        // Format data yang dilempar kembali ke form
                                                                        onChange({
                                                                            kodeBarang: String(row.Q), // Atau gunakan gabungan kode jika ada di kolom Q
                                                                            namaBarang: String(row.I),
                                                                            satuan: "Unit", // Sesuaikan jika di excel ada kolom satuan
                                                                            asetType: "peralatan_mesin", // Default atau sesuaikan mapping
                                                                            jumlah: 0,
                                                                            nomor: 0
                                                                        });
                                                                        setIsOpen(false);
                                                                    }}
                                                                >
                                                                    Select
                                                                </Button>
                                                            ) : (
                                                                <span className="text-foreground/40 text-xs italic">Tidak Tersedia</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {displayData.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan={5} className="text-center p-6 text-foreground/50">
                                                        Tidak ada data barang yang ditemukan.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onPress={() => setIsOpen(false)}>
                                    Tutup
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}