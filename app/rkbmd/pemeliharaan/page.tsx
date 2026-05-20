"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import FormPemeliharaanModal, { FormPemeliharaanData } from "@/app/rkbmd/pemeliharaan/addData";

const PEMELIHARAAN_STORAGE_KEY = "bmd_list_pemeliharaan";

export default function CreatePage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPemeliharaan, setListPemeliharaan] = useState<FormPemeliharaanData[]>([]);

    const [editIndex, setEditIndex] = useState<number | null>(null);
    // State baru untuk menampung data duplikat parsial
    const [duplicateData, setDuplicateData] = useState<{
        kuasaPenggunaBarang: string;
        program: string;
        kegiatan: string;
        output: string;
    } | null>(null);

    const [isExporting, setIsExporting] = useState(false);

    // ── Helper: Sorting Otomatis ─────────────────────────────────────────────
    const sortPemeliharaan = (data: FormPemeliharaanData[]) => {
        return [...data].sort((a, b) => {
            const kuasa = a.kuasaPenggunaBarang.localeCompare(b.kuasaPenggunaBarang);
            if (kuasa !== 0) return kuasa;
            const prog = a.program.localeCompare(b.program);
            if (prog !== 0) return prog;
            const keg = a.kegiatan.localeCompare(b.kegiatan);
            if (keg !== 0) return keg;
            return a.output.localeCompare(b.output);
        });
    };

    // ── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(PEMELIHARAAN_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setListPemeliharaan(sortPemeliharaan(parsed));
            }
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(PEMELIHARAAN_STORAGE_KEY, JSON.stringify(listPemeliharaan));
        } catch (error) {
            console.error("Gagal menyimpan ke localStorage:", error);
        }
    }, [listPemeliharaan, isLoaded]);

    // ── Handlers Modal & Aksi ─────────────────────────────────────────────────
    const handleOpenModalCreate = () => {
        setEditIndex(null);
        setDuplicateData(null); // Bersihkan data duplikat
        setIsModalOpen(true);
    };

    const handleOpenModalEdit = (index: number) => {
        setEditIndex(index);
        setDuplicateData(null); // Bersihkan data duplikat
        setIsModalOpen(true);
    };

    // Handler Baru: Buka Modal dengan data awal tersalin
    const handleOpenModalDuplicate = (index: number) => {
        const item = listPemeliharaan[index];
        setEditIndex(null); // Dianggap sebagai input Create baru
        setDuplicateData({
            kuasaPenggunaBarang: item.kuasaPenggunaBarang,
            program: item.program,
            kegiatan: item.kegiatan,
            output: item.output,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus rencana pemeliharaan ini?")) {
            setListPemeliharaan((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmitPemeliharaan = (newData: FormPemeliharaanData) => {
        setListPemeliharaan((prev) => {
            let nextState;
            if (editIndex !== null) {
                nextState = [...prev];
                nextState[editIndex] = newData;
            } else {
                nextState = [...prev, newData];
            }
            return sortPemeliharaan(nextState);
        });
        setIsModalOpen(false);
    };

    if (!isLoaded) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ── Header Halaman ── */}
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Data Pemeliharaan Barang
                    </h1>
                    <p className="text-sm text-foreground/60 mt-1">
                        Kelola dan catat seluruh riwayat pemeliharaan aset barang.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onPress={handleOpenModalCreate}
                        className="font-medium shadow-sm bg-primary text-primary-foreground"
                    >
                        + Tambah Pemeliharaan
                    </Button>
                </div>
            </div>

            {/* ── Render Tabel Data ── */}
            <div className="overflow-x-auto border rounded-xl shadow-sm bg-background">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-foreground/70 uppercase text-xs font-semibold tracking-wider border-b">
                        <tr>
                            <th className="px-4 py-3">Kuasa Pengguna Barang</th>
                            <th className="px-4 py-3">Program / Kegiatan / Output</th>
                            <th className="px-4 py-3">Barang & Ketersediaan</th>
                            <th className="px-4 py-3">Rencana Pemeliharaan</th>
                            <th className="px-4 py-3 text-right">Jumlah</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {listPemeliharaan.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-foreground/40">
                                    Belum ada data pemeliharaan. Klik tombol di atas untuk menambah data.
                                </td>
                            </tr>
                        ) : (
                            listPemeliharaan.map((item, index) => (
                                <tr key={index} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3.5 font-medium vertical-top w-52">
                                        {item.kuasaPenggunaBarang}
                                    </td>

                                    <td className="px-4 py-3.5 vertical-top w-64">
                                        <div className="font-semibold text-foreground text-xs">{item.program}</div>
                                        <div className="text-xs text-foreground/70 mt-1">- {item.kegiatan}</div>
                                        <div className="text-[11px] text-foreground/50 mt-0.5">- {item.output}</div>
                                    </td>

                                    <td className="px-4 py-3.5 vertical-top">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-foreground">{item.namaBarang}</div>
                                            <span className="px-1.5 py-0.5 text-[9px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider whitespace-nowrap">
                                                {item.asetType.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-mono text-foreground/50 mt-0.5">{item.kodeBarang}</div>
                                        <span className="inline-block text-[10px] px-1.5 py-0.5 mt-1.5 rounded border text-foreground/60 font-medium">
                                            Tersedia: {item.jumlahTersedia} {item.satuan}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3.5 text-foreground/90 font-medium vertical-top w-48">
                                        {item.namaPemeliharaan}
                                    </td>

                                    <td className="px-4 py-3.5 text-right font-semibold text-primary vertical-top whitespace-nowrap w-32">
                                        {item.jumlah} {item.satuan}
                                    </td>

                                    <td className="px-4 py-3.5 vertical-top w-36">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {/* Tombol DUPLICATE */}
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                onPress={() => handleOpenModalDuplicate(index)}
                                                aria-label="Duplikat"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                            </Button>

                                            {/* Tombol EDIT */}
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                onPress={() => handleOpenModalEdit(index)}
                                                aria-label="Edit"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"></path>
                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                </svg>
                                            </Button>

                                            {/* Tombol HAPUS */}
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="danger"
                                                onPress={() => handleDelete(index)}
                                                aria-label="Hapus"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Call Modal Component ── */}
            <FormPemeliharaanModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitPemeliharaan}
                initialData={editIndex !== null ? listPemeliharaan[editIndex] : null}
                duplicateData={duplicateData} // Kirim prop duplicateData
            />
        </div>
    );
}