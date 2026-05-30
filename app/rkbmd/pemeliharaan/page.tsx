"use client";

import { useState, useEffect } from "react";
import { Alert, Button, Checkbox, cn, Table, TableBody, TableCell, TableRow, EmptyState } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Plus, Copy, Pen, Trash, Wrench, TriangleAlert } from "lucide-react";
import FormPemeliharaanModal from "./addData";
import { ListPemeliharaan, FormPemeliharan } from "@/types/rkbmd";
import { loadStorage, PEMELIHARAAN_STORAGE_KEY, PERANGKAT_DAERAH_KEY } from "@/lib/bmd-storage";
import { JenisPerangkatDaerah, PerangkatDaerah } from "@/types/perangkatDaerah";
import { useVerifiedUsulan } from "../useVerifiedUsulan";
import { sortUsulan } from "../verificationUtil";
import { UsulanFilterBar } from "../filterBar";

export default function PemeliharaanPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [duplicateData, setDuplicateData] = useState<FormPemeliharan | null>(null);
    const [isPenggunaBarang, setIsPenggunaBarang] = useState(true);
    const [profile, setProfile] = useState<PerangkatDaerah | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

    // ── Hook ─────────────────────────────────────────────────────────────────
    const {
        verifiedData,
        filteredData,
        notVerifiedCount,
        filter,
        filterOptions,
        isFilterActive,
        setFilterField,
        resetFilter,
        setData: setListPemeliharaan,
    } = useVerifiedUsulan<ListPemeliharaan>(PEMELIHARAAN_STORAGE_KEY);

    const selectedCount =
        selectedKeys === "all"
            ? filteredData.length
            : (selectedKeys as Set<string>).size;

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        try {
            const currentProfile = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);
            if (currentProfile) {
                setProfile(currentProfile);
                setIsPenggunaBarang(currentProfile.jenis === JenisPerangkatDaerah.penggunaBarang);
            }
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
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
                bmd: null,
                usulanPemeliharaan: { namaPemeliharaan: "", jumlah: 0, satuan: "" },
                keterangan: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleDuplicate = (item: ListPemeliharaan) => {
        setEditIndex(null);
        setDuplicateData({
            ...item,
            bmd: null,
            usulanPemeliharaan: { namaPemeliharaan: "", jumlah: 0, satuan: "" },
            keterangan: "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus rencana pemeliharaan ini?")) {
            setListPemeliharaan((prev) => prev.filter((_, i) => i !== index));
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
                setListPemeliharaan((prev) =>
                    prev.filter((item) => !filteredData.some((f) => f === item))
                );
            } else {
                const ids = new Set(selectedKeys as Set<string>);
                setListPemeliharaan((prev) => prev.filter((_, i) => !ids.has(String(i))));
            }
            setSelectedKeys(new Set());
        }
    };

    const handleSubmitPemeliharaan = (newData: ListPemeliharaan) => {
        setListPemeliharaan((prev) => {
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
        setEditIndex(null);
        setIsModalOpen(false);
    };

    if (!isLoaded) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ── Header ── */}
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
                    {selectedCount > 0 && (
                        <Button variant="danger-soft" onPress={handleDeleteSelected}>
                            <Trash size={16} />
                            Hapus {selectedCount} Data
                        </Button>
                    )}
                    <Button onPress={() => handleOpen(null)}>
                        <Plus size={16} /> Tambah Pemeliharaan
                    </Button>
                </div>
            </div>

            {/* ── Alert Verifikasi ── */}
            {notVerifiedCount > 0 && (
                <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>
                            {notVerifiedCount} item tidak terverifikasi
                        </Alert.Title>
                        <Alert.Description>
                            <span className="block mt-1 text-xs space-y-0.5">
                                {verifiedData.some((i) => !i.penggunaBarangVerified) && (
                                    <span className="block">• <b>Pengguna Barang</b> tidak terdaftar</span>
                                )}
                                {verifiedData.some((i) => !i.kuasaPenggunaBarangVerified) && (
                                    <span className="block">• <b>Kuasa Pengguna Barang</b> tidak terdaftar</span>
                                )}
                                {verifiedData.some((i) => !i.programVerified) && (
                                    <span className="block">• <b>Program</b> tidak sesuai daftar resmi</span>
                                )}
                                {verifiedData.some((i) => !i.kegiatanVerified) && (
                                    <span className="block">• <b>Kegiatan</b> tidak sesuai program yang dipilih</span>
                                )}
                            </span>
                            <span className="block mt-1.5 text-xs">Perbaiki baris yang dicoret pada tabel.</span>
                        </Alert.Description>
                    </Alert.Content>
                    <Button
                        size="sm"
                        variant={filter.onlyInvalid ? "danger" : "danger-soft"}
                        onPress={() => setFilterField("onlyInvalid", !filter.onlyInvalid)}
                    >
                        <TriangleAlert size={14} />
                        {filter.onlyInvalid ? "Tampilkan Semua" : "Filter Invalid"}
                    </Button>
                </Alert>
            )}

            {/* ── Filter Bar ── */}
            <UsulanFilterBar
                filter={filter}
                filterOptions={filterOptions}
                isFilterActive={isFilterActive}
                totalCount={verifiedData.length}
                filteredCount={filteredData.length}
                setFilterField={setFilterField}
                resetFilter={resetFilter}
                onReset={() => setSelectedKeys(new Set())}
            />

            {/* ── Tabel ── */}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Pemeliharaan"
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
                            <Table.Column>Barang</Table.Column>
                            <Table.Column>Rencana Pemeliharaan</Table.Column>
                            <Table.Column>Aksi</Table.Column>
                        </Table.Header>
                        <TableBody
                            renderEmptyState={() => (
                                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                                    <Wrench size={40} className="text-muted" />
                                    <span className="text-sm text-muted">
                                        {isFilterActive
                                            ? "Tidak ada data yang sesuai filter."
                                            : "Belum ada data pemeliharaan. Klik tombol di atas untuk menambah data."}
                                    </span>
                                </EmptyState>
                            )}
                        >
                            {filteredData.map((item, index) => (
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

                                    {/* Pengguna Barang */}
                                    <TableCell className="align-top font-medium">
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-sm",
                                                item.penggunaBarangVerified ? "text-foreground" : "text-danger line-through"
                                            )}>
                                                {item.penggunaBarang}
                                            </span>
                                            <span className={cn(
                                                "text-xs",
                                                item.kuasaPenggunaBarangVerified ? "text-foreground/70" : "text-danger line-through"
                                            )}>
                                                {item.kuasaPenggunaBarang}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Program / Kegiatan / Output */}
                                    <TableCell className="align-top">
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "font-semibold text-xs",
                                                item.programVerified ? "text-foreground" : "text-danger line-through"
                                            )}>
                                                {item.program}
                                            </span>
                                            <span className={cn(
                                                "text-[11px] mt-1",
                                                item.kegiatanVerified ? "text-foreground/70" : "text-danger line-through"
                                            )}>
                                                - {item.kegiatan}
                                            </span>
                                            <span className="text-[10px] text-foreground/50 mt-0.5">
                                                - {item.output}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Barang */}
                                    <TableCell className="align-top">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-semibold text-foreground text-xs">{item.bmd.namaBarang}</div>
                                            <span className="px-1.5 py-0.5 text-[8px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider whitespace-nowrap">
                                                {item.bmd.asetType.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-foreground/50 mb-1.5">{item.bmd.kodeBarang}</div>
                                        <div className="text-xs font-semibold text-primary">
                                            Tersedia: {item.bmd.jumlah}{" "}
                                            <span className="font-normal text-foreground/60">{item.bmd.satuan}</span>
                                        </div>
                                    </TableCell>

                                    {/* Rencana Pemeliharaan */}
                                    <TableCell className="align-top">
                                        <div className="font-semibold text-foreground text-xs">{item.usulanPemeliharaan.namaPemeliharaan}</div>
                                        <div className="text-xs font-semibold text-warning-600 mt-1.5">
                                            {item.usulanPemeliharaan.jumlah}{" "}
                                            <span className="font-normal text-foreground/60">{item.usulanPemeliharaan.satuan}</span>
                                        </div>
                                        {item.keterangan && (
                                            <div className="text-[10px] text-foreground/60 mt-1 italic max-w-[200px] truncate">
                                                Ket: {item.keterangan}
                                            </div>
                                        )}
                                    </TableCell>

                                    {/* Aksi */}
                                    <TableCell className="align-top">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button variant="secondary" isIconOnly onPress={() => handleDuplicate(item)} aria-label="Duplikat">
                                                <Copy size={16} />
                                            </Button>
                                            <Button isIconOnly variant="secondary" onPress={() => handleOpen(item, index)} aria-label="Edit">
                                                <Pen size={16} />
                                            </Button>
                                            <Button isIconOnly variant="danger-soft" onPress={() => handleDelete(index)} aria-label="Hapus">
                                                <Trash size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </Table.Row>
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