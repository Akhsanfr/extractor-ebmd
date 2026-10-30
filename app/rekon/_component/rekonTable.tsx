"use client";
import { Button, Chip, ListBox, Pagination, Select, Table, Tooltip, type Key } from "@heroui/react";
import {
    columnSizingFeature,
    createColumnHelper,
    createPaginatedRowModel,
    createSortedRowModel,
    flexRender,
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
import { useEffect, useMemo, useState } from "react";
import { REKON_BERKAS_CONFIG, getBerkasKey, type RekonBerkasTipe } from "./rekonBerkas";
import { getSelisihStatus } from "./rekonStatus";
import {
    formatPersentase,
    formatRupiah,
    hitungPersentase,
    hitungSelisih,
    type RekonRow,
} from "./rekonUtil";

const features = tableFeatures({
    columnSizingFeature,
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

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
            className={`group flex w-full items-center gap-1.5 font-medium transition-colors hover:text-foreground ${align === "right" ? "justify-end" : "justify-start"
                }`}
            onClick={column.getToggleSortingHandler()}
        >
            <span>{title}</span>
            <Icon
                size={14}
                aria-hidden
                className={
                    sorted ? "text-accent" : "text-muted opacity-60 transition-opacity group-hover:opacity-100"
                }
            />
        </button>
    );
}

function SelisihCell({ row }: { row: RekonRow }) {
    const selisih = hitungSelisih(row);
    const status = getSelisihStatus(selisih);
    return (
        <div className="flex flex-col items-end gap-1">
            <span className={`font-medium tabular-nums ${status.textClass}`}>{formatRupiah(selisih)}</span>
            <Chip size="sm" variant="soft" color={status.chipColor}>
                <Chip.Label>{status.label}</Chip.Label>
            </Chip>
        </div>
    );
}

// Status satu dokumen. Tiap tipe dihitung dari key-nya sendiri, tidak bergantung pada dokumen lain.
function BerkasCell({
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
        <div className="flex justify-center">
            <Tooltip delay={300}>
                <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    aria-label={label}
                    className={`transition-transform hover:scale-110 ${tersedia ? "text-success" : "text-muted"}`}
                    onPress={() => onOpen(row, tipe)}
                >
                    <Icon size={18} />
                </Button>
                <Tooltip.Content>{tooltip}</Tooltip.Content>
            </Tooltip>
        </div>
    );
}

// Persentase dengan batang progres; warna mengikuti status selisih.
function PersentaseCell({ row }: { row: RekonRow }) {
    const persen = hitungPersentase(row);
    if (persen === null) return <div className="text-right text-muted">—</div>;

    const status = getSelisihStatus(hitungSelisih(row));
    const width = Math.min(100, Math.max(0, persen.toNumber()));
    return (
        <div className="ml-auto flex w-32 flex-col gap-1.5">
            <span className="text-right tabular-nums">{formatPersentase(persen)}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-default">
                <div
                    className={`h-full rounded-full ${status.barClass} transition-all duration-700 ease-out`}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
}

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
                    Tidak ada data untuk tahun, bulan, dan jenis rekon ini. Coba ubah filter atau import data.
                </p>
            </div>
        </div>
    );
}

export default function RekonTable({
    data,
    onEdit,
    onOpenBerkas,
    resetPageKey
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

    const columns = useMemo(
        () =>
            columnHelper.columns([
                // Nomor mengikuti posisi pada halaman aktif (setelah sorting), bukan selalu mulai dari 1.
                columnHelper.display({
                    id: "no",
                    header: "No",
                    size: 60,
                    cell: (ctx) => {
                        const posisi = ctx.table
                            .getRowModel()
                            .rows.findIndex((r) => r.id === ctx.row.id);
                        return (
                            <span className="text-muted tabular-nums">
                                {pagination.pageIndex * pagination.pageSize + posisi + 1}
                            </span>
                        );
                    },
                }),
                columnHelper.accessor("perangkatDaerahNama", {
                    header: (ctx) => <SortableHeader title="Perangkat Daerah" column={ctx.column} />,
                    size: 320,
                    sortFn: "text",
                    cell: (ctx) => <span className="font-medium">{ctx.getValue()}</span>,
                }),
                columnHelper.accessor("realisasiAnggaran", {
                    header: (ctx) => <SortableHeader title="Realisasi" column={ctx.column} align="right" />,
                    sortFn: "basic",
                    cell: (ctx) => (
                        <div className="text-right tabular-nums">{formatRupiah(ctx.getValue())}</div>
                    ),
                }),
                columnHelper.accessor("inputBMD", {
                    header: (ctx) => <SortableHeader title="Input BMD" column={ctx.column} align="right" />,
                    sortFn: "basic",
                    cell: (ctx) => (
                        <div className="text-right tabular-nums">{formatRupiah(ctx.getValue())}</div>
                    ),
                }),
                columnHelper.accessor((row) => hitungSelisih(row).toNumber(), {
                    id: "selisih",
                    header: (ctx) => <SortableHeader title="Kurang/Lebih" column={ctx.column} align="right" />,
                    sortFn: "basic",
                    cell: (ctx) => <SelisihCell row={ctx.row.original} />,
                }),
                // Persentase tak terhitung (realisasi 0) diurutkan sebagai nilai terkecil.
                columnHelper.accessor(
                    (row) => hitungPersentase(row)?.toNumber() ?? Number.NEGATIVE_INFINITY,
                    {
                        id: "persentase",
                        header: (ctx) => (
                            <SortableHeader title="Persentase" column={ctx.column} align="right" />
                        ),
                        sortFn: "basic",
                        cell: (ctx) => <PersentaseCell row={ctx.row.original} />,
                    },
                ),
                columnHelper.display({
                    id: "kertasKerja",
                    header: () => <div className="text-center">Kertas Kerja</div>,
                    size: 120,
                    cell: (ctx) => <BerkasCell row={ctx.row.original} tipe="kertasKerja" onOpen={onOpenBerkas} />,
                }),
                columnHelper.display({
                    id: "ba",
                    header: () => <div className="text-center">Berita Acara</div>,
                    size: 120,
                    cell: (ctx) => <BerkasCell row={ctx.row.original} tipe="ba" onOpen={onOpenBerkas} />,
                }),
                columnHelper.display({
                    id: "edit",
                    header: "Aksi",
                    size: 80,
                    cell: (ctx) => (
                        <Button
                            isIconOnly
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit input BMD ${ctx.row.original.perangkatDaerahNama}`}
                            className="transition-transform hover:scale-110"
                            onPress={() => onEdit(ctx.row.original)}
                        >
                            <Pencil size={16} />
                        </Button>
                    ),
                }),
            ]),
        [onEdit, onOpenBerkas, pagination.pageIndex, pagination.pageSize],
    );

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

    if (totalRows === 0) return <EmptyState />;

    useEffect(() => {
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [resetPageKey]);

    return (
        <>
            <Table aria-label="Tabel rekon realisasi anggaran dan input BMD">
                <Table.ScrollContainer>
                    <Table.Content>
                        <Table.Header className="sticky top-0 z-10">
                            {table.getFlatHeaders().map((header) => (
                                <Table.Column
                                    key={header.id}
                                    isRowHeader={header.column.id === "perangkatDaerahNama"}
                                    style={{ width: header.getSize() }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </Table.Column>
                            ))}
                        </Table.Header>
                        <Table.Body>
                            {rows.map((row) => (
                                <Table.Row key={row.id}>
                                    {row.getAllCells().map((cell) => (
                                        <Table.Cell
                                            key={cell.id}
                                            style={{ width: cell.column.getSize() }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            ))}
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