"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import FormPemeliharaanModal, { FormPemeliharaanData } from "./addData";
import { exportPemeliharaanToExcel } from "@/lib/exportExcel"; // Pastikan ejaannya exportExcel (atau ikuti file Anda)

const PEMELIHARAAN_STORAGE_KEY = "bmd_list_pemeliharaan";

export default function CreatePage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPemeliharaan, setListPemeliharaan] = useState<FormPemeliharaanData[]>([]);

    // State baru untuk menampung Index yang sedang di-edit. Null jika sedang create baru.
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // ── Helper: Sorting Otomatis ─────────────────────────────────────────────
    // Sort logic 100% sama dengan pengurutan excel (Kuasa -> Program -> Kegiatan -> Output)
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

    // ── Effect 1: Load Data Pertama Kali ──────────────────────────────────────
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(PEMELIHARAAN_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                // Biasakan men-sortir data jika mengambil dari DB/Storage yang mungkin belum rapi
                setListPemeliharaan(sortPemeliharaan(parsed));
            }
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // ── Effect 2: Simpan Data ke Storage Saat Berubah ────────────────────────
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
        setEditIndex(null); // Reset mode ke Create
        setIsModalOpen(true);
    };

    const handleOpenModalEdit = (index: number) => {
        setEditIndex(index); // Set mode ke Edit untuk indeks terpilih
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
                // Update / Edit (timpa array di posisi indeks lama)
                nextState = [...prev];
                nextState[editIndex] = newData;
            } else {
                // Create baru
                nextState = [...prev, newData];
            }
            // Auto-sort setiap kali save berhasil
            return sortPemeliharaan(nextState);
        });
        setIsModalOpen(false);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportPemeliharaanToExcel(listPemeliharaan);
        } catch (e) {
            console.error("Gagal export", e);
            alert("Gagal melakukan export Excel");
        } finally {
            setIsExporting(false);
        }
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
                        onPress={handleExport}
                        isPending={isExporting}
                        isDisabled={listPemeliharaan.length === 0}
                    >
                        {isExporting ? "Memproses..." : "Export Excel"}
                    </Button>

                    <Button
                        onPress={handleOpenModalCreate}
                        className="font-medium shadow-sm bg-primary text-primary-foreground"
                    >
                        + Tambah Pemeliharaan
                    </Button>
                </div>
            </div>

            {/* ── Render Hasil / Tabel Data ── */}
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

                                    <td className="px-4 py-3.5 vertical-top w-28">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                onPress={() => handleOpenModalEdit(index)}
                                                className="text-foreground/70 hover:text-primary"
                                                aria-label="Edit"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"></path>
                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                </svg>
                                            </Button>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="danger"
                                                onPress={() => handleDelete(index)}
                                                className="text-danger-500 hover:text-danger-700 bg-danger/10 hover:bg-danger/20"
                                                aria-label="Hapus"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                // Kirimkan object data spesifik jika editIndex tidak null (Edit Mode)
                initialData={editIndex !== null ? listPemeliharaan[editIndex] : null}
            />
        </div>
    );
}