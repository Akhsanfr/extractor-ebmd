"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Button,
    Card,
    Chip,
    EmptyState,
    Input,
    Label,
    ListBox,
    Pagination,
    ProgressBar,
    Select,
    Separator,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    TextField,
    toast,
} from "@heroui/react";
import { Download, MapPin, Search, Upload } from "lucide-react";
import {
    exportKmlAction,
    getDistinctPicAction,
    getListBmdAction,
    getStatistikAction,
    getStatistikPerPicAction,
} from "@/action/sebaranBmd/sebaranBmd.action";
import type {
    BmdTanahDTO,
    BmdTanahStatDTO,
    BmdTanahStatPerPicDTO,
    StatusPolygonFilter,
} from "@/action/sebaranBmd/sebaranBmd.contract";
import { UploadPolygonModal } from "./modal";

const PAGE_SIZE = 20;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <Card>
            <Card.Header className="pb-1">
                <Card.Description className="text-xs text-default-500 uppercase tracking-wide text-left w-full">
                    {label}
                </Card.Description>
            </Card.Header>
            <Card.Content className="pt-0">
                <p className="text-2xl font-bold">
                    {typeof value === "number" ? value.toLocaleString("id-ID") : value}
                </p>
            </Card.Content>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BmdTanahPage() {
    // ── State ─────────────────────────────────────────────────────────────────
    const [stat, setStat] = useState<BmdTanahStatDTO | null>(null);
    const [statPerPic, setStatPerPic] = useState<BmdTanahStatPerPicDTO[]>([]);
    const [picOptions, setPicOptions] = useState<string[]>([]);

    const [rows, setRows] = useState<BmdTanahDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [filterPic, setFilterPic] = useState("");
    const [filterStatus, setFilterStatus] = useState<StatusPolygonFilter>("semua");
    const [search, setSearch] = useState("");
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [modalNibar, setModalNibar] = useState<string | null>(null);
    const [kmlLoading, setKmlLoading] = useState(false);

    // ── Fetch helpers ─────────────────────────────────────────────────────────

    const fetchStat = useCallback(async () => {
        const [s, sp, pics] = await Promise.all([
            getStatistikAction(),
            getStatistikPerPicAction(),
            getDistinctPicAction(),
        ]);
        setStat(s);
        setStatPerPic(sp);
        setPicOptions(pics);
    }, []);

    const fetchList = useCallback(
        async (pg: number) => {
            setLoading(true);
            try {
                const result = await getListBmdAction({
                    pic: filterPic || undefined,
                    status: filterStatus,
                    search: search || undefined,
                    page: pg,
                    pageSize: PAGE_SIZE,
                });
                setRows(result.data);
                setTotal(result.total);
            } finally {
                setLoading(false);
            }
        },
        [filterPic, filterStatus, search]
    );

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchStat();
    }, [fetchStat]);

    // Reset page dan fetch ulang saat filter berubah
    useEffect(() => {
        setPage(1);
        fetchList(1);
    }, [filterPic, filterStatus, search, fetchList]);

    useEffect(() => {
        fetchList(page);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ──────────────────────────────────────────────────────────────

    function handleSearchChange(val: string) {
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => setSearch(val), 400);
    }

    async function handleExportKml() {
        setKmlLoading(true);
        try {
            const { kmlString, filename } = await exportKmlAction();
            const blob = new Blob([kmlString], { type: "application/vnd.google-earth.kml+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`File ${filename} berhasil diunduh.`);
        } catch {
            toast.danger("Gagal mengekspor KML.");
        } finally {
            setKmlLoading(false);
        }
    }

    function handleUploadSuccess() {
        fetchStat();
        fetchList(page);
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    // ── Pagination Helper ─────────────────────────────────────────────────────

    const getPageNumbers = (): (number | "ellipsis")[] => {
        // Jumlah angka tetangga (kiri & kanan) dari halaman aktif yang ingin ditampilkan
        const siblingCount = 1;

        // Total item minimum yang akan selalu dirender (1 + prev + next + 2 ellipsis) = 7
        const totalPageNumbers = siblingCount + 5;

        // Jika total halaman sedikit, tampilkan semuanya tanpa ellipsis
        if (totalPages <= totalPageNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(page - siblingCount, 1);
        const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        // Kondisi 1: Hanya titik-titik di kanan (Halaman aktif berada di awal)
        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, "ellipsis", totalPages];
        }

        // Kondisi 2: Hanya titik-titik di kiri (Halaman aktif berada di akhir)
        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [firstPageIndex, "ellipsis", ...rightRange];
        }

        // Kondisi 3: Titik-titik di kedua sisi (Halaman aktif berada di tengah)
        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [firstPageIndex, "ellipsis", ...middleRange, "ellipsis", lastPageIndex];
        }

        return [];
    };
    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 p-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Digitasi Tanah BMD</h1>
                    <p className="text-sm text-default-500">Manajemen polygon bidang tanah Barang Milik Daerah</p>
                </div>
                <Button
                    onPress={handleExportKml}
                    isPending={kmlLoading}
                ><Download size={16} />
                    Export KML
                </Button>
            </div>

            {/* ── Statistik ── */}
            {stat ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Barang" value={stat.total} />
                        <StatCard label="Sudah Digitasi" value={stat.sudahDigitasi} />
                        <StatCard label="Belum Digitasi" value={stat.belumDigitasi} />
                        <StatCard label="Progress" value={`${stat.progressPct}%`} />
                    </div>

                    <ProgressBar
                        value={stat.progressPct}
                        color="success"
                        className="max-w-full"
                    >
                        <div className="flex justify-between mb-1">
                            <Label>Progress Digitasi</Label>
                            {/* Menggantikan fungsi showValueLabel */}
                            <ProgressBar.Output />
                        </div>
                        <ProgressBar.Track>
                            <ProgressBar.Fill />
                        </ProgressBar.Track>
                    </ProgressBar>

                    {/* Stat per PIC */}
                    {statPerPic.length > 0 && (
                        <Card>
                            <Card.Header>
                                <Card.Title className="text-sm font-semibold">Statistik per PIC</Card.Title>
                            </Card.Header>
                            <Card.Content>
                                <Table>
                                    <Table.ScrollContainer>
                                        <Table.Content aria-label="Statistik per PIC">
                                            <Table.Header>
                                                <Table.Column isRowHeader>PIC</Table.Column>
                                                <Table.Column>Total</Table.Column>
                                                <Table.Column>Sudah</Table.Column>
                                                <Table.Column>Belum</Table.Column>
                                            </Table.Header>

                                            <Table.Body>
                                                {statPerPic.map((r) => (
                                                    <Table.Row
                                                        key={r.pic}
                                                        id={r.pic}
                                                    >
                                                        <Table.Cell>{r.pic}</Table.Cell>

                                                        <Table.Cell>
                                                            {r.total.toLocaleString("id-ID")}
                                                        </Table.Cell>

                                                        <Table.Cell>
                                                            <Chip color="success" size="sm">
                                                                {r.sudah}
                                                            </Chip>
                                                        </Table.Cell>

                                                        <Table.Cell>
                                                            <Chip color="warning" size="sm">
                                                                {r.belum}
                                                            </Chip>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Content>
                                    </Table.ScrollContainer>
                                </Table>
                            </Card.Content>
                        </Card>
                    )}
                </>
            ) : (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            )}

            <Separator />

            {/* ── Filter ── */}
            <div className="flex flex-wrap gap-3">
                {/* Filter PIC Select */}
                <Select
                    className="w-44"
                    value={filterPic ? [filterPic] : [""]}
                    onChange={(keys) => setFilterPic([...keys][0] as string ?? "")}
                    selectionMode="multiple"

                >
                    <Label>Filter PIC</Label>
                    <Select.Trigger>
                        <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item key="" textValue="Semua PIC">
                                <Label>Semua PIC</Label>
                            </ListBox.Item>
                            {picOptions.map((p) => (
                                <ListBox.Item key={p} textValue={p}>
                                    <Label>{p}</Label>
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                {/* Status Polygon Select */}
                <Select
                    selectionMode="multiple"
                    className="w-48"
                    value={[filterStatus]}
                    onChange={(keys) =>
                        setFilterStatus(([...keys][0] as StatusPolygonFilter) ?? "semua")
                    }
                >
                    <Label>Status Polygon</Label>
                    <Select.Trigger>
                        <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item key="semua" textValue="Semua">
                                <Label>Semua</Label>
                            </ListBox.Item>
                            <ListBox.Item key="sudah" textValue="Sudah Digitasi">
                                <Label>Sudah Digitasi</Label>
                            </ListBox.Item>
                            <ListBox.Item key="belum" textValue="Belum Digitasi">
                                <Label>Belum Digitasi</Label>
                            </ListBox.Item>
                        </ListBox>
                    </Select.Popover>
                </Select>

                <TextField
                    className="w-72"
                    onChange={handleSearchChange}
                >
                    <Label>Cari NIBAR / Nomor / Desa</Label>
                    <Input />
                </TextField>
            </div>

            {/* ── Table ── */}
            <div className="flex flex-col gap-2">
                <p className="text-xs text-default-500">
                    {loading ? "Memuat..." : `Menampilkan ${from}–${to} dari ${total.toLocaleString("id-ID")} data`}
                </p>

                <Table>
                    <Table.ScrollContainer>
                        <Table.Content aria-label="Daftar BMD Tanah">
                            <Table.Header>
                                <Table.Column isRowHeader>NIBAR</Table.Column>
                                <Table.Column>Hak</Table.Column>
                                <Table.Column>Nomor</Table.Column>
                                <Table.Column>Desa</Table.Column>
                                <Table.Column>PIC</Table.Column>
                                <Table.Column>Status</Table.Column>
                                <Table.Column>Aksi</Table.Column>
                            </Table.Header>

                            <Table.Body>
                                {rows.map((row) => (
                                    <Table.Row
                                        key={row.nibar}
                                        id={row.nibar}
                                    >
                                        <Table.Cell>{row.nibar}</Table.Cell>
                                        <Table.Cell>{row.hak ?? "-"}</Table.Cell>
                                        <Table.Cell>{row.nomor ?? "-"}</Table.Cell>
                                        <Table.Cell>{row.desa ?? "-"}</Table.Cell>
                                        <Table.Cell>{row.pic ?? "-"}</Table.Cell>

                                        <Table.Cell>
                                            {row.hasPolygon ? (
                                                <Chip color="success" size="sm">
                                                    Sudah Digitasi
                                                </Chip>
                                            ) : (
                                                <Chip size="sm">
                                                    Belum Digitasi
                                                </Chip>
                                            )}
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Button
                                                size="sm"
                                                onPress={() => setModalNibar(row.nibar)}
                                            >
                                                Upload Polygon
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Content>
                    </Table.ScrollContainer>
                </Table>

                {totalPages > 1 && (
                    <div className="flex justify-center mt-2">
                        {/* Properti root umumnya hanya untuk styling global seperti color */}
                        <Pagination color="primary">

                            <Pagination.Content>
                                {/* 1. TOMBOL PREVIOUS */}
                                <Pagination.Item>
                                    <Pagination.Previous
                                        isDisabled={page === 1}
                                        onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                                    >
                                        <Pagination.PreviousIcon />
                                    </Pagination.Previous>
                                </Pagination.Item>

                                {/* 2. RENDER ANGKA HALAMAN & ELLIPSIS */}
                                {/* Anda memerlukan fungsi helper seperti getPageNumbers() yang me-return array angka dan string "ellipsis" */}
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

                                {/* 3. TOMBOL NEXT */}
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
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {
                modalNibar && (
                    <UploadPolygonModal
                        nibar={modalNibar}
                        isOpen={!!modalNibar}
                        onClose={() => setModalNibar(null)}
                        onSuccess={handleUploadSuccess}
                    />
                )
            }
        </div >
    );
}