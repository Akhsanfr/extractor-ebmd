"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import FormPemeliharaanModal, { FormPemeliharaanData } from "./addData";
import { exportPemeliharaanToExcel } from "@/lib/export-exccel";

const PEMELIHARAAN_STORAGE_KEY = "bmd_list_pemeliharaan";

export default function CreatePage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [isLoaded, setIsLoaded] = useState(false); // Penanda hydrasi selesai
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPemeliharaan, setListPemeliharaan] = useState<FormPemeliharaanData[]>([]);

    // ── Effect 1: Load Data Pertama Kali (Component Mount) ───────────────────
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(PEMELIHARAAN_STORAGE_KEY);
            if (savedData) {
                setListPemeliharaan(JSON.parse(savedData));
            }
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            // Setelah selesai mengecek/memuat, tandai true agar Effect 2 bisa berjalan
            setIsLoaded(true);
        }
    }, []);

    // ── Effect 2: Simpan Data ke Storage Saat Berubah ────────────────────────
    useEffect(() => {
        // Jangan overwrite storage dengan array kosong jika Effect 1 belum selesai jalan
        if (!isLoaded) return;

        try {
            localStorage.setItem(PEMELIHARAAN_STORAGE_KEY, JSON.stringify(listPemeliharaan));
        } catch (error) {
            console.error("Gagal menyimpan ke localStorage:", error);
        }
    }, [listPemeliharaan, isLoaded]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmitPemeliharaan = (newData: FormPemeliharaanData) => {
        // Menambahkan data baru ke dalam list state
        setListPemeliharaan((prev) => [...prev, newData]);
        // Tutup modal setelah data berhasil disimpan
        setIsModalOpen(false);
    };
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true); // Putar loading
        try {
            await exportPemeliharaanToExcel(listPemeliharaan);
        } catch (e) {
            console.error("Gagal export", e);
            alert("Gagal melakukan export Excel");
        } finally {
            setIsExporting(false); // Stop loading
        }
    };
    // (Opsional) Jika loading awal belum selesai, Anda bisa menampilkan null 
    // atau skeleton agar tabel tidak "berkedip" dari kosong ke isi
    if (!isLoaded) {
        return null; // Bisa diganti dengan spinner/skeleton loading
    }

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

                {/* ── Action Buttons ── */}
                <div className="flex items-center gap-3">
                    <Button
                        onPress={handleExport}
                        isPending={isExporting} // Fitur loading otomatis dari HeroUI
                        isDisabled={listPemeliharaan.length === 0}
                    >
                        {isExporting ? "Memproses..." : "Export Excel"}
                    </Button>

                    <Button
                        onPress={handleOpenModal}
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
                            <th className="px-4 py-3">Program</th>
                            <th className="px-4 py-3">Kegiatan</th>
                            <th className="px-4 py-3">Output</th>
                            <th className="px-4 py-3">Kode Barang</th>
                            <th className="px-4 py-3">Nama Barang</th>
                            <th className="px-4 py-3">Jumlah Tersedia</th>
                            <th className="px-4 py-3">Satuan</th>
                            <th className="px-4 py-3">Aset Type</th>
                            <th className="px-4 py-3">Nama Pemeliharaan</th>
                            <th className="px-4 py-3 text-right">Jumlah</th>
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
                                    <td className="px-4 py-3.5 font-medium vertical-top">
                                        {item.kuasaPenggunaBarang}
                                    </td>

                                    <td className="px-4 py-3.5 vertical-top">
                                        <div className="font-medium text-foreground">{item.program}</div>
                                        <div className="text-xs text-foreground/50 mt-0.5">{item.kegiatan}</div>
                                    </td>

                                    <td className="px-4 py-3.5 text-foreground/80 vertical-top">
                                        {item.output}
                                    </td>

                                    <td className="px-4 py-3.5 vertical-top">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-foreground">{item.namaBarang}</div>
                                            {/* Menambahkan asetType sebagai badge/label */}
                                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider">
                                                {item.asetType}
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono text-foreground/40 mt-0.5">{item.kodeBarang}</div>
                                        <span className="inline-block text-[10px] px-1.5 py-0.5 mt-1 rounded bg-default-100 text-foreground/60 font-medium">
                                            Tersedia: {item.jumlahTersedia} {item.satuan}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3.5 text-foreground/90 font-medium vertical-top">
                                        {item.namaPemeliharaan}
                                    </td>

                                    <td className="px-4 py-3.5 text-right font-semibold text-primary vertical-top">
                                        {item.jumlah} {item.satuan}
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
                initialBarang={null}
            />
        </div>
    );
}