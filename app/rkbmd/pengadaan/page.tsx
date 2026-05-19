"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import FormPengadaanModal, { FormPengadaanData } from "@/app/rkbmd/pengadaan/addData";

const PENGADAAN_STORAGE_KEY = "bmd_list_pengadaan";

export default function RekapPengadaanPage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPengadaan, setListPengadaan] = useState<FormPengadaanData[]>([]);

    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [duplicateData, setDuplicateData] = useState<{
        kuasaPenggunaBarang: string;
        program: string;
        kegiatan: string;
        output: string;
    } | null>(null);

    // ── Helper: Sorting Otomatis ─────────────────────────────────────────────
    const sortPengadaan = (data: FormPengadaanData[]) => {
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
            const savedData = localStorage.getItem(PENGADAAN_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setListPengadaan(sortPengadaan(parsed));
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
            localStorage.setItem(PENGADAAN_STORAGE_KEY, JSON.stringify(listPengadaan));
        } catch (error) {
            console.error("Gagal menyimpan ke localStorage:", error);
        }
    }, [listPengadaan, isLoaded]);

    // ── Handlers Modal & Aksi ─────────────────────────────────────────────────
    const handleOpenModalCreate = () => {
        setEditIndex(null);
        setDuplicateData(null);
        setIsModalOpen(true);
    };

    const handleOpenModalEdit = (index: number) => {
        setEditIndex(index);
        setDuplicateData(null);
        setIsModalOpen(true);
    };

    const handleOpenModalDuplicate = (index: number) => {
        const item = listPengadaan[index];
        setEditIndex(null);
        setDuplicateData({
            kuasaPenggunaBarang: item.kuasaPenggunaBarang,
            program: item.program,
            kegiatan: item.kegiatan,
            output: item.output,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus usulan pengadaan ini?")) {
            setListPengadaan((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmitPengadaan = (newData: FormPengadaanData) => {
        setListPengadaan((prev) => {
            let nextState;
            if (editIndex !== null) {
                nextState = [...prev];
                nextState[editIndex] = newData;
            } else {
                nextState = [...prev, newData];
            }
            return sortPengadaan(nextState);
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
                        Data Usulan Pengadaan Barang
                    </h1>
                    <p className="text-sm text-foreground/60 mt-1">
                        Kelola dan catat seluruh usulan RKBMD pengadaan aset barang baru.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onPress={handleOpenModalCreate}
                        className="font-medium shadow-sm"
                    >
                        + Tambah Pengadaan
                    </Button>
                </div>
            </div>

            {/* ── Render Tabel Data ── */}
            <div className="overflow-x-auto border rounded-xl shadow-sm bg-background">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-foreground/70 uppercase text-[11px] font-semibold tracking-wider border-b">
                        <tr>
                            <th className="px-4 py-3">Kuasa Pengguna Barang</th>
                            <th className="px-4 py-3">Program / Kegiatan / Output</th>
                            <th className="px-4 py-3">Usulan Pengadaan</th>
                            <th className="px-4 py-3">BMD Dapat Dioptimalkan</th>
                            <th className="px-4 py-3">Kebutuhan Riil</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {listPengadaan.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-foreground/40">
                                    Belum ada data usulan pengadaan. Klik tombol di atas untuk menambah data.
                                </td>
                            </tr>
                        ) : (
                            listPengadaan.map((item, index) => (
                                <tr key={index} className="hover:bg-muted/30 transition-colors">

                                    {/* Kolom 1: Kuasa Pengguna Barang */}
                                    <td className="px-4 py-3.5 font-medium vertical-top w-48">
                                        {item.kuasaPenggunaBarang}
                                    </td>

                                    {/* Kolom 2: Program / Kegiatan / Output */}
                                    <td className="px-4 py-3.5 vertical-top w-56">
                                        <div className="font-semibold text-foreground text-xs">{item.program}</div>
                                        <div className="text-[11px] text-foreground/70 mt-1">- {item.kegiatan}</div>
                                        <div className="text-[10px] text-foreground/50 mt-0.5">- {item.output}</div>
                                    </td>

                                    {/* Kolom 3: Usulan Pengadaan */}
                                    <td className="px-4 py-3.5 vertical-top w-52">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-semibold text-foreground text-xs">{item.usulan.namaBarang}</div>
                                            <span className="px-1.5 py-0.5 text-[8px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider whitespace-nowrap">
                                                {item.usulan.asetType.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-foreground/50 mb-1.5">{item.usulan.kodeBarang}</div>
                                        <div className="text-xs font-semibold text-primary">
                                            {item.usulan.jumlah} <span className="font-normal text-foreground/60">{item.usulan.satuan}</span>
                                        </div>
                                    </td>

                                    {/* Kolom 4: BMD Bisa Dioptimalkan */}
                                    <td className="px-4 py-3.5 vertical-top w-48">
                                        {item.bmdBisaDioptimalkan ? (
                                            <>
                                                <div className="font-semibold text-foreground text-xs">{item.bmdBisaDioptimalkan.namaBarang}</div>
                                                <div className="text-[10px] font-mono text-foreground/50 mt-0.5 mb-1.5">{item.bmdBisaDioptimalkan.kodeBarang}</div>
                                                <div className="text-xs font-semibold text-warning-600">
                                                    {item.bmdBisaDioptimalkan.jumlah} <span className="font-normal text-foreground/60">{item.bmdBisaDioptimalkan.satuan}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-foreground/40 text-[11px] italic">Belum dioptimalkan</span>
                                        )}
                                    </td>

                                    {/* Kolom 5: Kebutuhan Riil */}
                                    <td className="px-4 py-3.5 vertical-top font-semibold text-foreground w-28">
                                        {item.kebutuhanRiil ? (
                                            `${item.kebutuhanRiil.jumlah} ${item.kebutuhanRiil.satuan}`
                                        ) : (
                                            <span className="text-foreground/40 text-[11px] font-normal italic">-</span>
                                        )}
                                    </td>

                                    {/* Kolom 6: Aksi */}
                                    <td className="px-4 py-3.5 vertical-top w-32">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                onPress={() => handleOpenModalDuplicate(index)}
                                                className="text-foreground/70"
                                                aria-label="Duplikat"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </Button>

                                            <Button
                                                isIconOnly
                                                size="sm"
                                                onPress={() => handleOpenModalEdit(index)}
                                                className="text-primary-600 bg-primary/10 hover:bg-primary/20"
                                                aria-label="Edit"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                            </Button>

                                            <Button
                                                isIconOnly
                                                size="sm"
                                                onPress={() => handleDelete(index)}
                                                className="text-danger-600 bg-danger/10 hover:bg-danger/20"
                                                aria-label="Hapus"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <FormPengadaanModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitPengadaan}
                initialData={editIndex !== null ? listPengadaan[editIndex] : null}
                duplicateData={duplicateData}
            />
        </div>
    );
}