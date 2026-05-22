"use client";

import { useState, useEffect } from "react";
import { Button, EmptyState, Table, TableBody, TableCell, TableRow } from "@heroui/react";
import FormPengadaanModal from "@/app/rkbmd/pengadaan/addData";
import { FormPengadaan, ListPengadaan } from "@/types/rkbmd";
import { loadStorage, PENGADAAN_STORAGE_KEY, PERANGKAT_DAERAH_KEY } from "@/lib/bmd-storage";
import { Copy, Pen, Plus, ShoppingBasket, Trash } from "lucide-react";
import { JenisPerangkatDaerah, PerangkatDaerah } from "@/types/perangkatDaerah";

// const PENGADAAN_STORAGE_KEY = "bmd_list_pengadaan";

const initialPengadaan: FormPengadaan = {
    penggunaBarang: "",
    kuasaPenggunaBarang: "",
    program: "",
    kegiatan: "",
    output: "",
    bmdBisaDioptimalkan: null,
    usulan: null,
    kebutuhanRiil: null
}

export default function RekapPengadaanPage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPengadaan, setListPengadaan] = useState<ListPengadaan[]>([]);
    const [perangkatDaerah, setPerangkatDaerah] = useState<PerangkatDaerah | null>(null)

    const [editIndex, setEditIndex] = useState<number | null>(null);

    // ── Helper: Sorting Otomatis ─────────────────────────────────────────────
    const sortPengadaan = (data: ListPengadaan[]) => {
        return [...data].sort((a, b) => {
            const pengguna = a.penggunaBarang.localeCompare(b.kuasaPenggunaBarang);
            if (pengguna !== 0) return pengguna;
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
            // load list pengadaan
            const listPengadaan = loadStorage<ListPengadaan[]>(PENGADAAN_STORAGE_KEY);
            setListPengadaan(listPengadaan ?? []);

            // load profile
            setPerangkatDaerah(loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY));

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
    const [initialData, setInitialData] = useState<FormPengadaan>(initialPengadaan)
    // ── Handlers Modal & Aksi ─────────────────────────────────────────────────
    const handleOpen = (initial: FormPengadaan | null) => {
        if (!perangkatDaerah) {
            alert("Lengkapi profile perankat daerah terlebih dahulu")
            return;
        }
        if (initial) {
            setInitialData(initial)
        } else {
            setInitialData({ penggunaBarang: perangkatDaerah.penggunaBarang, kuasaPenggunaBarang: perangkatDaerah.kuasaPenggunaBarang, program: "", kegiatan: "", output: "", usulan: null, bmdBisaDioptimalkan: null, kebutuhanRiil: null })
        }
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus usulan pengadaan ini?")) {
            setListPengadaan((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleCloseModal = () => {
        setInitialData(initialPengadaan)
        setIsModalOpen(false);
    };

    const handleSubmitPengadaan = (newData: ListPengadaan) => {
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
    const handleDuplicate = (item: ListPengadaan) => {
        setIsModalOpen(true)
        setInitialData({
            program: item.program,
            penggunaBarang: item.penggunaBarang,
            kuasaPenggunaBarang: item.kuasaPenggunaBarang,
            kegiatan: item.kegiatan,
            output: item.output,
            bmdBisaDioptimalkan: null,
            usulan: null,
            kebutuhanRiil: null
        })
    }



    if (!isLoaded) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ── Header Halaman ── */}
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Data Usulan Pengadaan Barang
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Kelola dan catat seluruh usulan RKBMD pengadaan aset barang baru.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => handleOpen(null)}
                    >
                        <Plus /> Tambah Pengadaan
                    </Button>
                </div>
            </div>

            {/* ── Render Tabel Data ── */}
            {/* <div className="overflow-x-auto border rounded-xl shadow-sm bg-background"> */}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content aria-label="Team members" className="min-w-[600px]">
                        <Table.Header>
                            <Table.Column isRowHeader className="flex flex-col">
                                <span className="font-bold text-foreground">Pengguna Barang</span>
                                <span className="text-xs text-muted">Kuasa Pengguna Barang</span></Table.Column>
                            <Table.Column>Program / Kegiatan / Output</Table.Column>
                            <Table.Column>Usulan Pengadaan</Table.Column>
                            <Table.Column>BMD Dapat Dioptimalkan</Table.Column>
                            <Table.Column>Kebutuhan Riil</Table.Column>
                            <Table.Column>Aksi</Table.Column>
                        </Table.Header>
                        <TableBody
                            renderEmptyState={() => (
                                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                                    <ShoppingBasket />
                                    <span className="text-sm text-muted">Belum ada data usulan pengadaan. Klik tombol di atas untuk menambah data.</span>
                                </EmptyState>
                            )}>
                            {listPengadaan.map((item, index) => (
                                <TableRow key={index}>
                                    {/* Kolom 1: Kuasa Pengguna Barang */}
                                    <TableCell className="align-top font-medium">
                                        <span>{item.penggunaBarang}</span>
                                        <span>{item.kuasaPenggunaBarang}</span>
                                    </TableCell>

                                    {/* Kolom 2: Program / Kegiatan / Output */}
                                    <TableCell className="align-top">
                                        <div className="font-semibold text-foreground text-xs">{item.program}</div>
                                        <div className="text-[11px] text-foreground/70 mt-1">- {item.kegiatan}</div>
                                        <div className="text-[10px] text-foreground/50 mt-0.5">- {item.output}</div>
                                    </TableCell>

                                    {/* Kolom 3: Usulan Pengadaan */}
                                    <TableCell className="align-top">
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
                                    </TableCell>

                                    {/* Kolom 4: BMD Bisa Dioptimalkan */}
                                    <TableCell className="align-top">
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
                                    </TableCell>

                                    {/* Kolom 5: Kebutuhan Riil */}
                                    <TableCell className="align-top font-semibold text-foreground">
                                        {item.kebutuhanRiil ? (
                                            `${item.kebutuhanRiil.jumlah} ${item.kebutuhanRiil.satuan}`
                                        ) : (
                                            <span className="text-foreground/40 text-[11px] font-normal italic">-</span>
                                        )}
                                    </TableCell>

                                    {/* Kolom 6: Aksi */}
                                    <TableCell className="align-top">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                variant="secondary"
                                                isIconOnly
                                                onPress={() => handleDuplicate(item)}
                                                aria-label="Duplikat"
                                            ><Copy /></Button>
                                            <Button
                                                isIconOnly
                                                variant="secondary"
                                                onPress={() => handleOpen(item)}
                                                aria-label="Edit"
                                            ><Pen /></Button>
                                            <Button
                                                isIconOnly
                                                variant="danger-soft"
                                                onPress={() => handleDelete(index)}
                                                aria-label="Hapus"
                                            ><Trash /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            {/* Modal */}{
                perangkatDaerah &&
                <FormPengadaanModal
                    isPenggunaBarang={perangkatDaerah.jenis === JenisPerangkatDaerah.penggunaBarang}
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitPengadaan}
                    initialData={initialData}
                />
            }
        </div >
    );
}