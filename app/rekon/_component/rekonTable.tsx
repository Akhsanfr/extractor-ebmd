"use client";
import { Button, Chip, ListBox, Pagination, Select, Table, Tooltip, type Key } from "@heroui/react";
import {
    createColumnHelper,
    createPaginatedRowModel,
    createSortedRowModel,
    rowPaginationFeature,
    rowSortingFeature,
    sortFn_basic,
    sortFn_text,
    tableFeatures,
    useTable,
    type Column,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, FileWarning, Inbox, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { REKON_BERKAS_CONFIG, getBerkasKey, type RekonBerkasTipe } from "./rekonBerkas";
import { getSelisihStatus } from "./rekonStatus";
import { formatTanggalLengkap } from "./rekonFilterBar";
import {
    formatPersentase,
    formatRupiah,
    hitungPersentase,
    hitungSelisih,
    type RekonRow,
} from "./rekonUtil";

const features = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    sortFns: {
        basic: sortFn_basic,
        text: sortFn_text,
    },
});
const columnHelper = createColumnHelper<typeof features, RekonRow>();

/* ------------------------------------------------------------------ */
/* Header & sel                                                        */
/* ------------------------------------------------------------------ */

// Header yang bisa diklik untuk mengurutkan, dengan indikator arah.
function SortableHeader<TValue>({
    title,
    column,
    align = "left",
}: {
    title: string;
    column: Column<typeof features, RekonRow, TValue>;
    align?: "left" | "right";
}) {
    const sorted = column.getIsSorted();
    const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
    return (
        <button
            type="button"
            className={`group flex w-full items-center gap-1 font-medium transition-colors hover:text-foreground ${align === "right" ? "justify-end" : "justify-start"
                }`}
            onClick={column.getToggleSortingHandler()}
        >
            <span>{title}</span>
            <Icon
                size={13}
                aria-hidden
                className={
                    sorted ? "text-accent" : "text-muted opacity-60 transition-opacity group-hover:opacity-100"
                }
            />
        </button>
    );
}

const Dash = () => <span className="text-muted">—</span>;

// Tanggal (dengan hari) di baris atas, nomor BA di baris bawah.
function TanggalBACell({ row }: { row: RekonRow }) {
    const tanggal = row.tanggalRekon ? formatTanggalLengkap(row.tanggalRekon) : null;
    return (
        <div className="flex flex-col leading-tight whitespace-nowrap">
            {tanggal ? <span className="font-medium tabular-nums">{tanggal}</span> : <Dash />}
            <span className="text-xs text-muted tabular-nums">{row.nomorBA || "—"}</span>
        </div>
    );
}

function AnggaranCell({ row }: { row: RekonRow }) {
    const line = (label: string, value: RekonRow["realisasiAnggaran"]) => (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted">{label}</span>
            <span className="tabular-nums">{value === null ? <Dash /> : formatRupiah(value)}</span>
        </div>
    );
    return (
        <div className="flex flex-col leading-tight">
            {line("Realisasi", row.realisasiAnggaran)}
            {line("Input BMD", row.inputBMD)}
        </div>
    );
}

// Selisih + status di baris atas, persentase + batang progres di baris bawah.
function HasilCell({ row }: { row: RekonRow }) {
    if (row.realisasiAnggaran === null || row.inputBMD === null) {
        return <div className="text-right"><Dash /></div>;
    }
    const selisih = hitungSelisih(row);
    const status = getSelisihStatus(selisih);
    const persen = hitungPersentase(row);
    const width = persen === null ? 0 : Math.min(100, Math.max(0, persen.toNumber()));

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
                <span className={`font-medium tabular-nums ${status.textClass}`}>{formatRupiah(selisih)}</span>
                <Chip size="sm" variant="soft" color={status.chipColor}>
                    <Chip.Label>{status.label}</Chip.Label>
                </Chip>
            </div>
            {persen === null ? (
                <span className="text-xs text-muted">—</span>
            ) : (
                <div className="flex w-full items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-default">
                        <div
                            className={`h-full rounded-full ${status.barClass} transition-all duration-700 ease-out`}
                            style={{ width: `${width}%` }}
                        />
                    </div>
                    <span className="w-14 text-right text-xs tabular-nums">{formatPersentase(persen)}</span>
                </div>
            )}
        </div>
    );
}

// Status satu dokumen. Tiap tipe dihitung dari key-nya sendiri, tidak bergantung pada dokumen lain.
function BerkasButton({
    row,
    tipe,
    onOpen,
}: {
    row: RekonRow;
    tipe: RekonBerkasTipe;
    onOpen: (row: RekonRow, tipe: RekonBerkasTipe) => void;
}) {
    const config = REKON_BERKAS_CONFIG[tipe];
    const tersedia = getBerkasKey(row, tipe) !== null;
    const Icon = tersedia ? config.icon : FileWarning;
    const tooltip = tersedia ? `Buka ${config.short}` : `${config.short} belum diunggah. Klik untuk upload`;
    const label = tersedia
        ? `Buka ${config.short} ${row.perangkatDaerahNama}`
        : `${config.short} ${row.perangkatDaerahNama} belum tersedia, buka untuk upload`;

    return (
        <Tooltip delay={300}>
            <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label={label}
                className={`transition-transform hover:scale-110 ${tersedia ? "text-success" : "text-muted"}`}
                onPress={() => onOpen(row, tipe)}
            >
                <Icon size={16} />
            </Button>
            <Tooltip.Content>{tooltip}</Tooltip.Content>
        </Tooltip>
    );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// Daftar nomor halaman dengan ellipsis. current: 1-based
function getPageItems(
    current: number,
    total: number,
): (number | "ellipsis-start" | "ellipsis-end")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", total];
    if (current >= total - 3)
        return [1, "ellipsis-start", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", total];
}

function TablePagination({
    pageIndex,
    pageSize,
    pageCount,
    totalRows,
    onPageChange,
    onPageSizeChange,
}: {
    pageIndex: number; // 0-based
    pageSize: number;
    pageCount: number;
    totalRows: number;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}) {
    const current = pageIndex + 1;
    const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
    const end = Math.min(totalRows, (pageIndex + 1) * pageSize);

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Baris per halaman</span>
                <Select
                    className="w-24"
                    aria-label="Baris per halaman"
                    value={String(pageSize)}
                    onChange={(key: Key | null) => key && onPageSizeChange(Number(key))}
                >
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <ListBox.Item key={size} id={String(size)} textValue={String(size)}>
                                    {size}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>
            </div>

            <Pagination>
                <Pagination.Summary>
                    {start}–{end} dari {totalRows}
                </Pagination.Summary>
                <Pagination.Content>
                    <Pagination.Item>
                        <Pagination.Previous
                            isDisabled={current <= 1}
                            onPress={() => onPageChange(pageIndex - 1)}
                        >
                            <Pagination.PreviousIcon />
                            Sebelumnya
                        </Pagination.Previous>
                    </Pagination.Item>

                    {getPageItems(current, pageCount).map((item) =>
                        typeof item === "number" ? (
                            <Pagination.Item key={item}>
                                <Pagination.Link
                                    isActive={item === current}
                                    onPress={() => onPageChange(item - 1)}
                                >
                                    {item}
                                </Pagination.Link>
                            </Pagination.Item>
                        ) : (
                            <Pagination.Item key={item}>
                                <Pagination.Ellipsis />
                            </Pagination.Item>
                        ),
                    )}

                    <Pagination.Item>
                        <Pagination.Next
                            isDisabled={current >= pageCount}
                            onPress={() => onPageChange(pageIndex + 1)}
                        >
                            Berikutnya
                            <Pagination.NextIcon />
                        </Pagination.Next>
                    </Pagination.Item>
                </Pagination.Content>
            </Pagination>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Inbox size={22} />
            </span>
            <div>
                <p className="font-medium">Belum ada data rekon</p>
                <p className="text-sm text-muted">
                    Tidak ada data untuk tahun, bulan, jenis rekon, dan filter ini. Coba ubah filter atau import data.
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Definisi kolom                                                      */
/* ------------------------------------------------------------------ */

// Kolom TanStack hanya mendefinisikan data untuk sorting.
// Tata letak tampilan (kolom yang digabung) disusun manual di JSX supaya
// Realisasi, Input BMD, Selisih, dan Persentase tetap bisa diurutkan sendiri-sendiri
// walau berbagi satu kolom visual.
const columns = columnHelper.columns([
    columnHelper.accessor("perangkatDaerahNama", { id: "perangkatDaerahNama", sortFn: "text" }),
    // Belum ada PIC (null) diurutkan sebagai nilai terkecil.
    columnHelper.accessor((row) => row.pic ?? "", { id: "pic", sortFn: "text" }),
    columnHelper.accessor((row) => row.tanggalRekon ?? "", { id: "tanggalRekon", sortFn: "text" }),
    columnHelper.accessor("realisasiAnggaran", { id: "realisasiAnggaran", sortFn: "basic" }),
    columnHelper.accessor("inputBMD", { id: "inputBMD", sortFn: "basic" }),
    columnHelper.accessor(
        (row) =>
            row.realisasiAnggaran === null || row.inputBMD === null ? null : hitungSelisih(row).toNumber(),
        { id: "selisih", sortFn: "basic" },
    ),
    // Persentase tak terhitung (realisasi 0) diurutkan sebagai nilai terkecil.
    columnHelper.accessor((row) => hitungPersentase(row)?.toNumber() ?? Number.NEGATIVE_INFINITY, {
        id: "persentase",
        sortFn: "basic",
    }),
]);

/* ------------------------------------------------------------------ */
/* Tabel                                                               */
/* ------------------------------------------------------------------ */

const cellClass = "py-1.5 align-middle";

export default function RekonTable({
    data,
    onEdit,
    onOpenBerkas,
    resetPageKey,
}: {
    data: RekonRow[];
    onEdit: (row: RekonRow) => void;
    onOpenBerkas: (row: RekonRow, tipe: RekonBerkasTipe) => void;
    resetPageKey: string;
}) {
    // Default: Perangkat Daerah ascending.
    const [sorting, setSorting] = useState<SortingState>([
        { id: "perangkatDaerahNama", desc: false },
    ]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const table = useTable({
        features,
        columns,
        data,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: (updater) => {
            setSorting(updater);
            // kembali ke halaman 1 setiap urutan berubah
            setPagination((p) => ({ ...p, pageIndex: 0 }));
        },
        onPaginationChange: setPagination,
        // Data baru (mis. setelah edit lewat setQueryData) jangan mengembalikan ke halaman 1.
        // Reset ke halaman 1 ditangani manual: ganti sorting, ganti filter (resetPageKey),
        // dan penyesuaian saat halaman melebihi pageCount.
        autoResetPageIndex: false,
    });

    // baris halaman aktif saja (sudah terurut + terpaginasi)
    const rows = table.getRowModel().rows;
    const totalRows = data.length;
    const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize));

    // Jika jumlah data berkurang, kembalikan ke halaman terakhir yang valid.
    useEffect(() => {
        if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
            setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
        }
    }, [pageCount, pagination.pageIndex]);

    // Ganti filter (perangkat daerah, PIC, tanggal, jenis rekon) -> kembali ke halaman 1.
    // Harus dipanggil sebelum early return di bawah agar urutan hooks selalu sama.
    useEffect(() => {
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [resetPageKey]);

    if (totalRows === 0) return <EmptyState />;

    const col = (id: string) => table.getColumn(id)!;

    return (
        <>
            <Table aria-label="Tabel rekon realisasi anggaran dan input BMD" className="text-sm">
                <Table.ScrollContainer>
                    <Table.Content>
                        <Table.Header className="sticky top-0 z-10">
                            <Table.Column className="w-12">No</Table.Column>
                            <Table.Column isRowHeader className="min-w-60">
                                <SortableHeader title="Perangkat Daerah" column={col("perangkatDaerahNama")} />
                            </Table.Column>
                            <Table.Column className="w-24">
                                <SortableHeader title="PIC" column={col("pic")} />
                            </Table.Column>
                            <Table.Column className="min-w-44">
                                <div className="flex flex-col gap-0.5">
                                    <SortableHeader title="Tanggal Rekon" column={col("tanggalRekon")} />
                                    <span className="text-xs font-normal text-muted">Nomor BA</span>
                                </div>
                            </Table.Column>
                            <Table.Column className="min-w-52">
                                <div className="flex flex-col items-end gap-0.5">
                                    <SortableHeader title="Realisasi" column={col("realisasiAnggaran")} align="right" />
                                    <SortableHeader title="Input BMD" column={col("inputBMD")} align="right" />
                                </div>
                            </Table.Column>
                            <Table.Column className="min-w-60">
                                <div className="flex flex-col items-end gap-0.5">
                                    <SortableHeader title="Kurang/Lebih" column={col("selisih")} align="right" />
                                    <SortableHeader title="Persentase" column={col("persentase")} align="right" />
                                </div>
                            </Table.Column>
                            <Table.Column className="w-24">
                                <div className="text-center">Berkas</div>
                            </Table.Column>
                            <Table.Column className="min-w-40">Keterangan</Table.Column>
                            <Table.Column className="w-14">Aksi</Table.Column>
                        </Table.Header>
                        <Table.Body>
                            {rows.map((row, i) => {
                                const r = row.original;
                                return (
                                    <Table.Row key={row.id}>
                                        <Table.Cell className={cellClass}>
                                            <span className="text-muted tabular-nums">
                                                {pagination.pageIndex * pagination.pageSize + i + 1}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <span className="font-medium">{r.perangkatDaerahNama}</span>
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            {r.pic ? (
                                                <Chip size="sm" variant="soft" color="accent">
                                                    <Chip.Label>{r.pic}</Chip.Label>
                                                </Chip>
                                            ) : (
                                                <Dash />
                                            )}
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <TanggalBACell row={r} />
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <AnggaranCell row={r} />
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <HasilCell row={r} />
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <div className="flex justify-center gap-0.5">
                                                <BerkasButton row={r} tipe="kertasKerja" onOpen={onOpenBerkas} />
                                                <BerkasButton row={r} tipe="ba" onOpen={onOpenBerkas} />
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <div className="max-w-40 truncate" title={r.keterangan ?? undefined}>
                                                {r.keterangan || <Dash />}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className={cellClass}>
                                            <Button
                                                isIconOnly
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Edit input BMD ${r.perangkatDaerahNama}`}
                                                className="transition-transform hover:scale-110"
                                                onPress={() => onEdit(r)}
                                            >
                                                <Pencil size={15} />
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            <TablePagination
                pageIndex={pagination.pageIndex}
                pageSize={pagination.pageSize}
                pageCount={pageCount}
                totalRows={totalRows}
                onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
                onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
            />
        </>
    );
}