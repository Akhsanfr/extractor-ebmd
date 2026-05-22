"use client";

import { useState, useEffect } from "react";
import { Button, Table, TableBody, TableCell, TableRow, EmptyState } from "@heroui/react";
import { Plus, Copy, Pen, Trash, Wrench } from "lucide-react";
import FormPemeliharaanModal from "./addData";
import { ListPemeliharaan, FormPemeliharan } from "@/types/rkbmd";
import { loadStorage, saveStorage, PEMELIHARAAN_STORAGE_KEY, PERANGKAT_DAERAH_KEY } from "@/lib/bmd-storage";
import { convertPemeliharaanV1toV2 } from "./util";
import { JenisPerangkatDaerah, PerangkatDaerah } from "@/types/perangkatDaerah";

export default function PemeliharaanPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPemeliharaan, setListPemeliharaan] = useState<ListPemeliharaan[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [duplicateData, setDuplicateData] = useState<FormPemeliharan | null>(null);

    const [isPenggunaBarang, setIsPenggunaBarang] = useState(true);
    const [profile, setProfile] = useState<PerangkatDaerah | null>(null);

    useEffect(() => {
        try {
            const currentProfile = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);
            if (currentProfile) {
                setProfile(currentProfile);
                setIsPenggunaBarang(currentProfile.jenis === JenisPerangkatDaerah.penggunaBarang);
            }

            let savedData = loadStorage<ListPemeliharaan[]>(PEMELIHARAAN_STORAGE_KEY);

            // Fallback migrasi jika kosong (mungkin data masih di v1)
            if (!savedData || savedData.length === 0) {
                savedData = convertPemeliharaanV1toV2();
            }

            if (savedData) {
                setListPemeliharaan(savedData);
            }
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        saveStorage(PEMELIHARAAN_STORAGE_KEY, listPemeliharaan);
    }, [listPemeliharaan, isLoaded]);

    const handleOpen = (item: ListPemeliharaan | null, index?: number) => {
        if (item && index !== undefined) {
            setEditIndex(index);
            setDuplicateData(item);
        } else {
            setEditIndex(null);
            setDuplicateData({
                penggunaBarang: profile?.penggunaBarang || "",
                kuasaPenggunaBarang: profile?.kuasaPenggunaBarang || "",
                program: "",
                kegiatan: "",
                output: "",
                bmd: null, // validasi akan mencegah submit
                usulanPemeliharaan: {
                    namaPemeliharaan: "",
                    jumlah: 0,
                    satuan: "",
                },
                keterangan: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleDuplicate = (item: ListPemeliharaan) => {
        setEditIndex(null); // Create baru
        setDuplicateData({
            ...item,
            // Hapus data barang agar dipilih ulang, tapi biarkan Renja tetap ada
            bmd: null,
            usulanPemeliharaan: {
                namaPemeliharaan: "",
                jumlah: 0,
                satuan: "",
            },
            keterangan: "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus rencana pemeliharaan ini?")) {
            setListPemeliharaan((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmitPemeliharaan = (newData: ListPemeliharaan) => {
        setListPemeliharaan((prev) => {
            if (editIndex !== null) {
                const next = [...prev];
                next[editIndex] = newData;
                return next;
            }
            return [...prev, newData];
        });
        setIsModalOpen(false);
    };

    if (!isLoaded) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
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
                    <Button onPress={() => handleOpen(null)}>
                        <Plus size={16} /> Tambah Pemeliharaan
                    </Button>
                </div>
            </div>

            <Table>
                <Table.ScrollContainer>
                    <Table.Content aria-label="Pemeliharaan" className="min-w-[600px]">
                        <Table.Header>
                            <Table.Column isRowHeader className="flex flex-col">
                                <span className="font-bold text-foreground">Pengguna Barang</span>
                                <span className="text-xs text-muted">Kuasa Pengguna Barang</span>
                            </Table.Column>
                            <Table.Column>Program / Kegiatan / Output</Table.Column>
                            <Table.Column>Barang</Table.Column>
                            <Table.Column>Rencana Pemeliharaan</Table.Column>
                            <Table.Column>Aksi</Table.Column>
                        </Table.Header>
                        <TableBody
                            renderEmptyState={() => (
                                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                                    <Wrench size={40} className="text-muted" />
                                    <span className="text-sm text-muted">Belum ada data pemeliharaan. Klik tombol di atas untuk menambah data.</span>
                                </EmptyState>
                            )}
                        >
                            {listPemeliharaan.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="align-top font-medium">
                                        <div className="flex flex-col">
                                            <span>{item.penggunaBarang}</span>
                                            <span className="text-foreground/70">{item.kuasaPenggunaBarang}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="font-semibold text-foreground text-xs">{item.program}</div>
                                        <div className="text-[11px] text-foreground/70 mt-1">- {item.kegiatan}</div>
                                        <div className="text-[10px] text-foreground/50 mt-0.5">- {item.output}</div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-semibold text-foreground text-xs">{item.bmd.namaBarang}</div>
                                            <span className="px-1.5 py-0.5 text-[8px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider whitespace-nowrap">
                                                {item.bmd.asetType.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-foreground/50 mb-1.5">{item.bmd.kodeBarang}</div>
                                        <div className="text-xs font-semibold text-primary">
                                            Tersedia: {item.bmd.jumlah} <span className="font-normal text-foreground/60">{item.bmd.satuan}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="font-semibold text-foreground text-xs">{item.usulanPemeliharaan.namaPemeliharaan}</div>
                                        <div className="text-xs font-semibold text-warning-600 mt-1.5">
                                            {item.usulanPemeliharaan.jumlah} <span className="font-normal text-foreground/60">{item.usulanPemeliharaan.satuan}</span>
                                        </div>
                                        {item.keterangan && (
                                            <div className="text-[10px] text-foreground/60 mt-1 italic max-w-[200px] truncate">
                                                Ket: {item.keterangan}
                                            </div>
                                        )}
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                variant="secondary"
                                                isIconOnly
                                                onPress={() => handleDuplicate(item)}
                                                aria-label="Duplikat"
                                            ><Copy size={16} /></Button>
                                            <Button
                                                isIconOnly
                                                variant="secondary"
                                                onPress={() => handleOpen(item, index)}
                                                aria-label="Edit"
                                            ><Pen size={16} /></Button>
                                            <Button
                                                isIconOnly
                                                variant="danger-soft"
                                                onPress={() => handleDelete(index)}
                                                aria-label="Hapus"
                                            ><Trash size={16} /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            {duplicateData && (
                <FormPemeliharaanModal
                    isPenggunaBarang={isPenggunaBarang}
                    open={isModalOpen}
                    initialData={duplicateData}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmitPemeliharaan}
                />
            )}
        </div>
    );
}