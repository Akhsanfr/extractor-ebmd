"use client";
import { Button, ListBox, Pagination, Select, Table, type Key } from "@heroui/react";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Edit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
}: {
    title: string;
    column: Column<typeof features, RekonRow, TValue>;
}) {
    const sorted = column.getIsSorted();
    const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
    return (
        <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={column.getToggleSortingHandler()}
        >
            <span>{title}</span>
            <Icon size={14} className={sorted ? "text-accent" : "text-muted"} aria-hidden />
        </button>
    );
}

// Selisih > 0: input BMD masih kurang (warning). < 0: lebih (danger). 0: sudah sama (success).
function SelisihCell({ row }: { row: RekonRow }) {
    const selisih = hitungSelisih(row);
    const { colorClass, label } = selisih.isZero()
        ? { colorClass: "text-success", label: "Sesuai" }
        : selisih.isPositive()
            ? { colorClass: "text-warning", label: "Kurang" }
            : { colorClass: "text-danger", label: "Lebih" };
    return (
        <div className={`text-right tabular-nums ${colorClass}`}>
            <div>{formatRupiah(selisih)}</div>
            <div className="text-xs">{label}</div>
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
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
                        )
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

export default function RekonTable({
    data,
    onEdit,
}: {
    data: RekonRow[];
    onEdit: (row: RekonRow) => void;
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
                        return pagination.pageIndex * pagination.pageSize + posisi + 1;
                    },
                }),
                columnHelper.accessor("perangkatDaerahNama", {
                    header: (ctx) => <SortableHeader title="Perangkat Daerah" column={ctx.column} />,
                    size: 320,
                    sortFn: "text",
                }),
                columnHelper.accessor("realisasiAnggaran", {
                    header: (ctx) => <SortableHeader title="Realisasi" column={ctx.column} />,
                    sortFn: "basic",
                    cell: (ctx) => (
                        <div className="text-right tabular-nums">{formatRupiah(ctx.getValue())}</div>
                    ),
                }),
                columnHelper.accessor("inputBMD", {
                    header: (ctx) => <SortableHeader title="Input BMD" column={ctx.column} />,
                    sortFn: "basic",
                    cell: (ctx) => (
                        <div className="text-right tabular-nums">{formatRupiah(ctx.getValue())}</div>
                    ),
                }),
                columnHelper.accessor((row) => hitungSelisih(row).toNumber(), {
                    id: "selisih",
                    header: (ctx) => <SortableHeader title="Kurang/Lebih" column={ctx.column} />,
                    sortFn: "basic",
                    cell: (ctx) => <SelisihCell row={ctx.row.original} />,
                }),
                // Persentase tak terhitung (realisasi 0) diurutkan sebagai nilai terkecil.
                columnHelper.accessor(
                    (row) => hitungPersentase(row)?.toNumber() ?? Number.NEGATIVE_INFINITY,
                    {
                        id: "persentase",
                        header: (ctx) => <SortableHeader title="Persentase" column={ctx.column} />,
                        sortFn: "basic",
                        cell: (ctx) => (
                            <div className="text-right tabular-nums">
                                {formatPersentase(hitungPersentase(ctx.row.original))}
                            </div>
                        ),
                    },
                ),
                columnHelper.display({
                    id: "edit",
                    header: "Edit",
                    size: 80,
                    cell: (ctx) => (
                        <Button
                            variant="secondary"
                            size="sm"
                            aria-label={`Edit input BMD ${ctx.row.original.perangkatDaerahNama}`}
                            onPress={() => onEdit(ctx.row.original)}
                        >
                            <Edit />
                        </Button>
                    ),
                }),
            ]),
        [onEdit, pagination.pageIndex, pagination.pageSize],
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
                            {rows.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={table.getFlatHeaders().length}>
                                        Belum ada data rekon untuk tahun, bulan, dan jenis rekon ini.
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                rows.map((row) => (
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
                                ))
                            )}
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
