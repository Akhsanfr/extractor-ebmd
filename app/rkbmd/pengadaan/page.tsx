"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Alert, Button, Checkbox, cn, EmptyState, Table, TableBody, TableCell, TableRow } from "@heroui/react";
import type { Selection } from "@heroui/react";
import FormPengadaanModal from "@/app/rkbmd/pengadaan/addData";
import { FormPengadaan, ListPengadaan } from "@/types/rkbmd";
import { loadStorage, PENGADAAN_STORAGE_KEY, PERANGKAT_DAERAH_KEY } from "@/lib/bmd-storage";
import { Copy, Pen, Plus, ShoppingBasket, Trash } from "lucide-react";
import { JenisPerangkatDaerah, PerangkatDaerah, PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { buildVerifiedList, sortUsulan } from "../util";

const initialPengadaan: FormPengadaan = {
    penggunaBarang: "",
    kuasaPenggunaBarang: "",
    program: "",
    kegiatan: "",
    output: "",
    bmdBisaDioptimalkan: null,
    usulan: null,
    kebutuhanRiil: null,
};

export default function RekapPengadaanPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listPengadaan, setListPengadaan] = useState<ListPengadaan[]>([]);
    const [perangkatDaerah, setPerangkatDaerah] = useState<PerangkatDaerah | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [initialData, setInitialData] = useState<FormPengadaan>(initialPengadaan);

    // State baru untuk menggantikan useRef demi kemudahan render/sinkronisasi
    const [availablePerangkatDaerah, setAvailablePerangkatDaerah] = useState<PerangkatDaerahJson[]>([]);

    // ── Selection State ──────────────────────────────────────────────────────
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

    const selectedCount =
        selectedKeys === "all"
            ? listPengadaan.length
            : (selectedKeys as Set<string>).size;


    // ── Computed State (Verifikasi Usulan) ───────────────────────────────────
    const verifiedUsulan: (ListPengadaan & {
        penggunaBarangVerified: boolean,
        kuasaPenggunaBarangVerified: boolean,
    })[] = useMemo(() => {
        // Abaikan false-negative saat JSON belum selesai di-fetch
        if (availablePerangkatDaerah.length === 0) {
            return listPengadaan.map((item) => ({ ...item, penggunaBarangVerified: true, kuasaPenggunaBarangVerified: true }));
        }
        return buildVerifiedList(listPengadaan, availablePerangkatDaerah);
    }, [listPengadaan, availablePerangkatDaerah]);

    const hasNotverified = useMemo(
        () => verifiedUsulan.some((item) => !item.penggunaBarangVerified),
        [verifiedUsulan]
    );

    // ── Effects ──────────────────────────────────────────────────────────────

    // 1. Initial Load Storage + JSON Fetch
    useEffect(() => {
        try {
            const stored = loadStorage<ListPengadaan[]>(PENGADAAN_STORAGE_KEY);
            setListPengadaan(stored ?? []);
            setPerangkatDaerah(loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY));
            fetch("/data/perangkatDaerah.json")
                .then((res) => res.json())
                .then((data: PerangkatDaerahJson[]) => {
                    setAvailablePerangkatDaerah(data);
                })
                .catch((error) => console.error("Gagal load perangkatDaerah.json:", error));
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // 2. Autosave ke localStorage setiap kali data listPengadaan berubah
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(PENGADAAN_STORAGE_KEY, JSON.stringify(listPengadaan));
        } catch (error) {
            console.error("Gagal menyimpan ke localStorage:", error);
        }
    }, [listPengadaan, isLoaded]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleOpen = (initial: FormPengadaan | null, index: number | null = null) => {
        if (!perangkatDaerah) {
            alert("Lengkapi profile perangkat daerah terlebih dahulu");
            return;
        }
        setInitialData(
            initial ?? {
                penggunaBarang: perangkatDaerah.penggunaBarang,
                kuasaPenggunaBarang: perangkatDaerah.kuasaPenggunaBarang,
                program: "", kegiatan: "", output: "",
                usulan: null, bmdBisaDioptimalkan: null, kebutuhanRiil: null,
            }
        );
        setEditIndex(index); // Set index di sini agar form tau mana yang diedit
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus usulan pengadaan ini?")) {
            setListPengadaan((prev) => prev.filter((_, i) => i !== index));
            setSelectedKeys((prev) => {
                if (prev === "all") return new Set();
                const next = new Set(prev as Set<string>);
                next.delete(String(index));
                return next;
            });
        }
    };

    const handleDeleteSelected = () => {
        if (confirm(`Hapus ${selectedCount} data yang dipilih?`)) {
            if (selectedKeys === "all") {
                setListPengadaan([]);
            } else {
                const indexes = new Set(
                    Array.from(selectedKeys as Set<string>).map(Number)
                );
                setListPengadaan((prev) => prev.filter((_, i) => !indexes.has(i)));
            }
            setSelectedKeys(new Set());
        }
    };

    const handleCloseModal = () => {
        setInitialData(initialPengadaan);
        setEditIndex(null); // Reset index edit saat modal ditutup
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
            return sortUsulan(nextState);
        });
        setSelectedKeys(new Set());
        setEditIndex(null); // Bersihkan sisa state edit
        setIsModalOpen(false);
    };

    const handleDuplicate = (item: ListPengadaan) => {
        setInitialData({
            program: item.program,
            penggunaBarang: item.penggunaBarang,
            kuasaPenggunaBarang: item.kuasaPenggunaBarang,
            kegiatan: item.kegiatan,
            output: item.output,
            bmdBisaDioptimalkan: null,
            usulan: null,
            kebutuhanRiil: null,
        });
        setEditIndex(null); // Duplikat adalah data baru, jadi pastikan index edit null
        setIsModalOpen(true);
    };

    if (!isLoaded) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ── Header ── */}
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
                    {selectedCount > 0 && (
                        <Button variant="danger-soft" onPress={handleDeleteSelected}>
                            <Trash />
                            Hapus {selectedCount} Data
                        </Button>
                    )}
                    <Button onPress={() => handleOpen(null)}>
                        <Plus /> Tambah Pengadaan
                    </Button>
                </div>
            </div>
            {hasNotverified &&
                <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Data tidak terverifikasi</Alert.Title>
                        <Alert.Description>
                            Masih terdapat data <b>Pengguna Barang</b> yang tidak sesuai daftar. Perbaiki item usulan yang dicoret.
                        </Alert.Description>
                    </Alert.Content>
                    <Button size="sm" variant="danger-soft">
                        Filter Data
                    </Button>
                </Alert>

            }
            {/* ── Tabel ── */}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Data usulan pengadaan"
                        className="min-w-[600px]"
                        selectedKeys={selectedKeys}
                        selectionMode="multiple"
                        onSelectionChange={setSelectedKeys}
                    >
                        <Table.Header>
                            <Table.Column className="pr-0 w-10">
                                <Checkbox aria-label="Pilih semua" slot="selection">
                                    <Checkbox.Control>
                                        <Checkbox.Indicator />
                                    </Checkbox.Control>
                                </Checkbox>
                            </Table.Column>
                            <Table.Column isRowHeader>
                                <span className="font-bold text-foreground">Pengguna Barang</span>
                                <span className="text-xs text-muted block">Kuasa Pengguna Barang</span>
                            </Table.Column>
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
                                    <span className="text-sm text-muted">
                                        Belum ada data usulan pengadaan. Klik tombol di atas untuk menambah data.
                                    </span>
                                </EmptyState>
                            )}
                        >
                            {verifiedUsulan.map((item, index) => (
                                <Table.Row key={index} id={String(index)}>
                                    <Table.Cell className="pr-0">
                                        <Checkbox
                                            aria-label={`Pilih baris ${index + 1}`}
                                            slot="selection"
                                            variant="secondary"
                                        >
                                            <Checkbox.Control>
                                                <Checkbox.Indicator />
                                            </Checkbox.Control>
                                        </Checkbox>
                                    </Table.Cell>

                                    <TableCell className="align-top">
                                        <div className="flex flex-col">
                                            <span
                                                className={cn(
                                                    "font-medium text-sm",
                                                    item.penggunaBarangVerified
                                                        ? "text-foreground"
                                                        : "text-danger line-through"
                                                )}
                                            >
                                                {item.penggunaBarang}
                                            </span>

                                            <span
                                                className={cn(
                                                    "text-xs",
                                                    item.kuasaPenggunaBarangVerified
                                                        ? "text-muted"
                                                        : "text-danger line-through"
                                                )}
                                            >
                                                {item.kuasaPenggunaBarang}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {item.program}
                                            </span>
                                            <span className="text-xs">
                                                - {item.kegiatan}
                                            </span>
                                            <span className="text-xs">
                                                - {item.output}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-semibold text-foreground text-xs">{item.usulan.namaBarang}</div>
                                            <span className="px-1.5 py-0.5 text-[8px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider whitespace-nowrap">
                                                {item.usulan.asetType.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-foreground/50 mb-1.5">{item.usulan.kodeBarang}</div>
                                        <div className="text-xs font-semibold text-primary">
                                            {item.usulan.jumlah}{" "}
                                            <span className="font-normal text-foreground/60">{item.usulan.satuan}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        {item.bmdBisaDioptimalkan ? (
                                            <>
                                                <div className="font-semibold text-foreground text-xs">{item.bmdBisaDioptimalkan.namaBarang}</div>
                                                <div className="text-[10px] font-mono text-foreground/50 mt-0.5 mb-1.5">{item.bmdBisaDioptimalkan.kodeBarang}</div>
                                                <div className="text-xs font-semibold text-warning-600">
                                                    {item.bmdBisaDioptimalkan.jumlah}{" "}
                                                    <span className="font-normal text-foreground/60">{item.bmdBisaDioptimalkan.satuan}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-foreground/40 text-[11px] italic">Belum dioptimalkan</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="align-top font-semibold text-foreground">
                                        {item.kebutuhanRiil
                                            ? `${item.kebutuhanRiil.jumlah} ${item.kebutuhanRiil.satuan}`
                                            : <span className="text-foreground/40 text-[11px] font-normal italic">-</span>
                                        }
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button variant="secondary" isIconOnly onPress={() => handleDuplicate(item)} aria-label="Duplikat">
                                                <Copy />
                                            </Button>
                                            <Button isIconOnly variant="secondary" onPress={() => handleOpen(item, index)} aria-label="Edit">
                                                <Pen />
                                            </Button>
                                            <Button isIconOnly variant="danger-soft" onPress={() => handleDelete(index)} aria-label="Hapus">
                                                <Trash />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </Table.Row>
                            ))}
                        </TableBody>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            {perangkatDaerah && (
                <FormPengadaanModal
                    isPenggunaBarang={perangkatDaerah.jenis === JenisPerangkatDaerah.penggunaBarang}
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitPengadaan}
                    initialData={initialData}
                />
            )}
        </div>
    );
}