"use client";

import { useState, useEffect, useMemo } from "react";
import { Alert, Button, Checkbox, cn, EmptyState, Table, TableBody, TableCell, TableRow, Pagination } from "@heroui/react";
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

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Reset page to 1 when filter changes
    useEffect(() => {
        setPage(1);
    }, [filter]);

    // Reset selected keys when page or rowsPerPage changes
    useEffect(() => {
        setSelectedKeys(new Set());
    }, [page, rowsPerPage]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const from = filteredData.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const to = Math.min(page * rowsPerPage, filteredData.length);

    const getPageNumbers = (): (number | "ellipsis")[] => {
        const siblingCount = 1;
        const totalPageNumbers = siblingCount + 5;

        if (totalPages <= totalPageNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(page - siblingCount, 1);
        const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, "ellipsis", totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [firstPageIndex, "ellipsis", ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [firstPageIndex, "ellipsis", ...middleRange, "ellipsis", lastPageIndex];
        }

        return [];
    };

    const selectedCount =
        selectedKeys === "all"
            ? paginatedData.length
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
                const indicesToDelete = new Set(paginatedData.map((f) => f.originalIndex));
                setListPengadaan((prev) =>
                    prev.filter((_, i) => !indicesToDelete.has(i))
                );
            } else {
                const ids = new Set(Array.from(selectedKeys as Set<string>).map(Number));
                setListPengadaan((prev) => prev.filter((_, i) => !ids.has(i)));
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
                            {paginatedData.map((item, index) => (
                                <Table.Row key={item.originalIndex} id={String(item.originalIndex)}>
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
                                            <Button isIconOnly variant="secondary" onPress={() => handleOpen(item, item.originalIndex)} aria-label="Edit"><Pen /></Button>
                                            <Button isIconOnly variant="danger-soft" onPress={() => handleDelete(item.originalIndex)} aria-label="Hapus"><Trash /></Button>
                                        </div>
                                    </TableCell>
                                </Table.Row>
                            ))}
                        </TableBody>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            {/* ── Pagination Controls ── */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 px-2">
                <div className="text-sm text-foreground/60">
                    Menampilkan {from} - {to} dari {filteredData.length} data
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground/60">Baris per halaman:</span>
                        <select
                            className="bg-background border border-divider rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                    {totalPages > 1 && (
                        <Pagination color="primary" size="sm">
                            <Pagination.Content>
                                <Pagination.Item>
                                    <Pagination.Previous
                                        isDisabled={page === 1}
                                        onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                                    >
                                        <Pagination.PreviousIcon />
                                    </Pagination.Previous>
                                </Pagination.Item>

                                {getPageNumbers().map((p, i) =>
                                    p === "ellipsis" ? (
                                        <Pagination.Item key={`ellipsis-${i}`}>
                                            <Pagination.Ellipsis />
                                        </Pagination.Item>
                                    ) : (
                                        <Pagination.Item key={p}>
                                            <Pagination.Link
                                                isActive={p === page}
                                                onPress={() => setPage(p)}
                                            >
                                                {p}
                                            </Pagination.Link>
                                        </Pagination.Item>
                                    )
                                )}

                                <Pagination.Item>
                                    <Pagination.Next
                                        isDisabled={page === totalPages}
                                        onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                    >
                                        <Pagination.NextIcon />
                                    </Pagination.Next>
                                </Pagination.Item>
                            </Pagination.Content>
                        </Pagination>
                    )}
                </div>
            </div>

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