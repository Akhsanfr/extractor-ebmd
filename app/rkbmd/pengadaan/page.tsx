"use client";

import { useState, useEffect } from "react";
import { Alert, Button, Checkbox, cn, EmptyState, Table, TableBody, TableCell, TableRow } from "@heroui/react";
import { UsulanFilterBar } from "../filterBar";
import type { Selection } from "@heroui/react";
import FormPengadaanModal from "@/app/rkbmd/pengadaan/addData";
import { FormPengadaan, ListPengadaan } from "@/types/rkbmd";
import { loadStorage, PENGADAAN_STORAGE_KEY, PERANGKAT_DAERAH_KEY } from "@/lib/bmd-storage";
import { Copy, Pen, Plus, ShoppingBasket, Trash, TriangleAlert } from "lucide-react";
import { JenisPerangkatDaerah, PerangkatDaerah } from "@/types/perangkatDaerah";
import { sortUsulan } from "../verificationUtil";
import { useVerifiedUsulan } from "../useVerifiedUsulan";

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
    const [perangkatDaerah, setPerangkatDaerah] = useState<PerangkatDaerah | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [initialData, setInitialData] = useState<FormPengadaan>(initialPengadaan);
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
        setData: setListPengadaan,
    } = useVerifiedUsulan<ListPengadaan>(PENGADAAN_STORAGE_KEY);

    const selectedCount =
        selectedKeys === "all"
            ? filteredData.length
            : (selectedKeys as Set<string>).size;

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        try {
            setPerangkatDaerah(loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY));
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
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
        setEditIndex(index);
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
                setListPengadaan((prev) =>
                    prev.filter((item) => !filteredData.some((f) => f === item))
                );
            } else {
                const ids = new Set(selectedKeys as Set<string>);
                setListPengadaan((prev) => prev.filter((_, i) => !ids.has(String(i))));
            }
            setSelectedKeys(new Set());
        }
    };

    const handleCloseModal = () => {
        setInitialData(initialPengadaan);
        setEditIndex(null);
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
        setEditIndex(null);
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
        setEditIndex(null);
        setIsModalOpen(true);
    };

    if (!isLoaded) return null;

    return (
        <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between w-full">
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

            {/* ── Alert Verifikasi ── */}
            {notVerifiedCount > 0 && (
                <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>{notVerifiedCount} item tidak terverifikasi</Alert.Title>
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
                        <TriangleAlert />
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
                        aria-label="Data usulan pengadaan"
                        className="min-w-[600px]"
                        selectedKeys={selectedKeys}
                        selectionMode="multiple"
                        onSelectionChange={setSelectedKeys}
                    >
                        <Table.Header>
                            <Table.Column className="pr-0 w-10">
                                <Checkbox aria-label="Pilih semua" slot="selection">
                                    <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
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
                                        {isFilterActive
                                            ? "Tidak ada data yang sesuai filter."
                                            : "Belum ada data usulan pengadaan. Klik tombol di atas untuk menambah data."}
                                    </span>
                                </EmptyState>
                            )}
                        >
                            {filteredData.map((item, index) => (
                                <Table.Row key={index} id={String(index)}>
                                    <Table.Cell className="pr-0">
                                        <Checkbox aria-label={`Pilih baris ${index + 1}`} slot="selection" variant="secondary">
                                            <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                                        </Checkbox>
                                    </Table.Cell>

                                    <TableCell className="align-top">
                                        <div className="flex flex-col">
                                            <span className={cn("font-medium text-sm", item.penggunaBarangVerified ? "text-foreground" : "text-danger line-through")}>
                                                {item.penggunaBarang}
                                            </span>
                                            <span className={cn("text-xs", item.kuasaPenggunaBarangVerified ? "text-muted" : "text-danger line-through")}>
                                                {item.kuasaPenggunaBarang}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                        <div className="flex flex-col">
                                            <span className={cn("font-medium text-sm", item.programVerified ? "text-foreground" : "text-danger line-through")}>
                                                {item.program}
                                            </span>
                                            <span className={cn("text-xs", item.kegiatanVerified ? "text-foreground/70" : "text-danger line-through")}>
                                                - {item.kegiatan}
                                            </span>
                                            <span className="text-xs text-foreground/50">- {item.output}</span>
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
                                            <Button variant="secondary" isIconOnly onPress={() => handleDuplicate(item)} aria-label="Duplikat"><Copy /></Button>
                                            <Button isIconOnly variant="secondary" onPress={() => handleOpen(item, index)} aria-label="Edit"><Pen /></Button>
                                            <Button isIconOnly variant="danger-soft" onPress={() => handleDelete(index)} aria-label="Hapus"><Trash /></Button>
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
        </>
    );
}