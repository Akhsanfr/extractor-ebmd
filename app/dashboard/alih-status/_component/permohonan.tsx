import { Description } from "@/component/description";
import {
    Alert,
    Label,
    Input,
    Select,
    Autocomplete,
    ListBox,
    SearchField,
    EmptyState,
    useFilter,
    type Key,
    Chip,
    Pagination,
} from "@heroui/react";
import {
    createColumnHelper,
    flexRender,
    tableFeatures,
    useTable,
    columnSizingFeature,
    columnFilteringFeature,
    rowPaginationFeature,
    createFilteredRowModel,
    createPaginatedRowModel,
    filterFn_includesString,
    filterFn_equalsString,
    type Column,
    type ColumnFiltersState,
    type PaginationState,
} from "@tanstack/react-table";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { TableCellStack } from "./data/tableCellStack";
import { Table } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";
import { AlihStatusType } from "@/enum/alihStatus";

const features = tableFeatures({
    columnSizingFeature,
    columnFilteringFeature,
    rowPaginationFeature,
    filteredRowModel: createFilteredRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    filterFns: {
        includesString: filterFn_includesString,
        equalsString: filterFn_equalsString,
    },
});
const columnHelper = createColumnHelper<typeof features, AlihStatusPermohonanContract.SelectDTO>();

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function DetailPermohonan({
    data,
    isLoading,
    action,
    rowAction,
    shouldTable = false,
}: {
    data: AlihStatusPermohonanContract.SelectDTO[],
    isLoading: boolean,
    action?: ReactNode,
    rowAction?: (row: AlihStatusPermohonanContract.SelectDTO) => void;
    shouldTable?: boolean
}) {

    const isJamak = (data?.length ?? 0) > 1;
    // Pada mode tabel, data kosong (mis. hasil filter) tetap ditampilkan sebagai tabel
    // dengan baris "Tidak ada data", bukan alert "belum ada dokumen".
    const isKosong = (!data || data.length === 0) && !shouldTable;

    return (
        <>
            <div className="flex justify-between items-center">
                <Label>Permohonan Alih Status</Label>
                {action}
            </div>
            {
                isLoading ? <Loading /> :
                    isKosong ? (
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Belum ada dokumen Permohonan</Alert.Title>
                                {
                                    action &&
                                    <Alert.Description>Buat Permohonan dengan klik tombol tambah diatas</Alert.Description>
                                }
                            </Alert.Content>
                        </Alert>
                    ) : isJamak || shouldTable ? (
                        <RenderTable data={data!} rowAction={rowAction} />
                    ) : (
                        <Description
                            items={[[
                                { label: "ID", value: `# ${data![0].id}` },
                                { label: "Tahun", value: data![0].tahun }
                            ], [
                                { label: "Jenis Alih Status", value: data![0].alihStatusType },
                                { label: "Alasan Alih Status", value: data![0].alasan }
                            ],
                            [
                                { label: "Nomor Surat", value: data![0].suratNomor },
                                { label: "Tanggal Surat", value: data![0].suratTanggal }
                            ],
                            { label: "Hal Surat", value: data![0].suratHal },
                            { label: "Perangkat Daerah Asal", value: data![0].perangkatDaerahAsal },
                            [
                                { label: "Pengguna Barang Asal", value: data![0].penggunaBarangAsalNama },
                                { label: "Pangkat Pengguna Barang Asal", value: data![0].penggunaBarangAsalPangkat }
                            ], [
                                { label: "NIP Pengguna Barang Asal", value: data![0].penggunaBarangAsalNIP },
                                { label: "Jabatan Pengguna Barang Asal", value: data![0].penggunaBarangAsalJabatan }
                            ]
                            ]}
                        />
                    )}
        </>
    );
}

// Header dengan text input filter (kolom bebas teks)
function ColumnHeaderFilter<TValue>({
    title,
    column,
}: {
    title: string;
    column: Column<typeof features, AlihStatusPermohonanContract.SelectDTO, TValue>;
}) {
    return (
        <div className="flex flex-col gap-1 py-1" onClick={(e) => e.stopPropagation()}>
            <span>{title}</span>
            {column.getCanFilter() && (
                <Input
                    placeholder={`Cari ${title.toLowerCase()}...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(e) => column.setFilterValue(e.target.value)}
                />
            )}
        </div>
    );
}

// Header dengan Select (opsi sedikit, sudah pasti/fixed) — dipakai untuk Jenis Alih Status
function ColumnHeaderSelectFilter<TValue>({
    title,
    column,
    options,
}: {
    title: string;
    column: Column<typeof features, AlihStatusPermohonanContract.SelectDTO, TValue>;
    options: readonly string[];
}) {
    const ALL = "__all__";
    const filterValue = (column.getFilterValue() as string) ?? ALL;

    return (
        <div className="flex flex-col gap-1 py-1" onClick={(e) => e.stopPropagation()}>
            <span>{title}</span>
            {column.getCanFilter() && (
                <Select
                    className="w-full"
                    placeholder={`Semua ${title.toLowerCase()}`}
                    value={filterValue}
                    onChange={(key: Key | null) => {
                        const value = key ? String(key) : ALL;
                        column.setFilterValue(value === ALL ? undefined : value);
                    }}
                >
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item id={ALL} textValue="Semua">
                                Semua
                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                            {options.map((opt) => (
                                <ListBox.Item key={opt} id={opt} textValue={opt}>
                                    {opt}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>
            )}
        </div>
    );
}

// Header dengan Autocomplete (opsi banyak, perlu pencarian) — dipakai untuk Perangkat Daerah Asal
function ColumnHeaderAutocompleteFilter<TValue>({
    title,
    column,
    options,
}: {
    title: string;
    column: Column<typeof features, AlihStatusPermohonanContract.SelectDTO, TValue>;
    options: readonly string[];
}) {
    const { contains } = useFilter({ sensitivity: "base" });
    const filterValue = (column.getFilterValue() as string) ?? null;

    return (
        <div className="flex flex-col gap-1 py-1" onClick={(e) => e.stopPropagation()}>
            <span>{title}</span>
            {column.getCanFilter() && (
                <Autocomplete
                    className="w-full"
                    placeholder={`Cari ${title.toLowerCase()}...`}
                    value={filterValue}
                    onChange={(key: Key | null) =>
                        column.setFilterValue(key ? String(key) : undefined)
                    }
                >
                    <Autocomplete.Trigger>
                        <Autocomplete.Value />
                        <Autocomplete.ClearButton />
                        <Autocomplete.Indicator />
                    </Autocomplete.Trigger>
                    <Autocomplete.Popover>
                        <Autocomplete.Filter filter={contains}>
                            <SearchField>
                                <SearchField.Group>
                                    <SearchField.SearchIcon />
                                    <SearchField.Input placeholder="Cari..." />
                                </SearchField.Group>
                            </SearchField>
                            <ListBox
                                renderEmptyState={() => (
                                    <EmptyState>Tidak ditemukan</EmptyState>
                                )}
                            >
                                {options.map((opt) => (
                                    <ListBox.Item key={opt} id={opt} textValue={opt}>
                                        {opt}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Autocomplete.Filter>
                    </Autocomplete.Popover>
                </Autocomplete>
            )}
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

function RenderTable({
    data,
    rowAction,
}: {
    data: AlihStatusPermohonanContract.SelectDTO[];
    rowAction?: (row: AlihStatusPermohonanContract.SelectDTO) => void;
}) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const alihStatusTypeOptions = useMemo(() => Object.values(AlihStatusType), []);

    const columns = useMemo(() => {
        const cols = columnHelper.columns([
            columnHelper.accessor("id", {
                header: (ctx) => <ColumnHeaderFilter title="ID" column={ctx.column} />,
                size: 25,
                cell: (ctx) => `# ${ctx.row.original.id}`,
                filterFn: "includesString",
            }),
            columnHelper.accessor("alihStatusType", {
                header: (ctx) => (
                    <ColumnHeaderSelectFilter
                        title="Jenis Alih Status"
                        column={ctx.column}
                        options={alihStatusTypeOptions}
                    />
                ),
                filterFn: "equalsString",
            }),
            columnHelper.accessor("suratNomor", {
                header: (ctx) => <ColumnHeaderFilter title="Nomor Surat" column={ctx.column} />,
                filterFn: "includesString",
                cell: (ctx) => (
                    <TableCellStack
                        columns={[
                            ctx.row.original.suratNomor,
                            ctx.row.original.suratHal,
                            ctx.row.original.suratTanggal,
                        ]}
                    />
                ),
            }),
            columnHelper.accessor("alasan", {
                header: (ctx) => <ColumnHeaderFilter title="Alasan" column={ctx.column} />,
                filterFn: "includesString",
            }),
            columnHelper.accessor("perangkatDaerahAsal", {
                header: (ctx) => (
                    <ColumnHeaderAutocompleteFilter
                        title="Perangkat Daerah Asal"
                        column={ctx.column}
                        options={PerangkatDaerah}
                    />
                ),
                filterFn: "equalsString",
            }),
            columnHelper.accessor("penggunaBarangAsalNama", {
                header: (ctx) => <ColumnHeaderFilter title="Pengguna Barang" column={ctx.column} />,
                filterFn: "includesString",
                cell: (ctx) => (
                    <TableCellStack
                        columns={[
                            ctx.row.original.penggunaBarangAsalNama,
                            ctx.row.original.penggunaBarangAsalNIP,
                            ctx.row.original.penggunaBarangAsalPangkat,
                            ctx.row.original.penggunaBarangAsalJabatan,
                        ]}
                    />
                ),
            }),
            // Filter status dipindahkan ke switcher di DetailPermohonan.action (page),
            // jadi kolom ini hanya menampilkan chip tanpa filter header.
            columnHelper.accessor("isDone", {
                header: "Status Permohonan",
                enableColumnFilter: false,
                cell: (ctx) =>
                    ctx.getValue() ? (
                        <Chip color="success">Selesai</Chip>
                    ) : (
                        <Chip color="warning">Belum Selesai</Chip>
                    ),
            }),
        ]);

        if (rowAction) {
            cols.push(
                columnHelper.display({
                    id: "aksi",
                    header: "Aksi",
                    enableColumnFilter: false,
                    cell: (ctx) => rowAction(ctx.row.original),
                })
            );
        }

        return cols;
    }, [rowAction, alihStatusTypeOptions]);

    const table = useTable({
        features,
        columns,
        data,
        state: {
            columnFilters,
            pagination,
        },
        onColumnFiltersChange: (updater) => {
            setColumnFilters(updater);
            // kembali ke halaman 1 setiap filter berubah
            setPagination((p) => ({ ...p, pageIndex: 0 }));
        },
        onPaginationChange: setPagination,
    });

    // baris halaman aktif saja (sudah terfilter + terpaginasi)
    const rows = table.getRowModel().rows;
    // total baris setelah filter, sebelum paginasi
    const totalRows = table.getFilteredRowModel().rows.length;
    const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize));

    // Filter status kini berada di luar tabel (data berubah dari parent),
    // jadi pageIndex bisa melebihi jumlah halaman. Kembalikan ke halaman terakhir yang valid.
    useEffect(() => {
        if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
            setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
        }
    }, [pageCount, pagination.pageIndex]);

    return (
        <>
            <Table aria-label="Tabel data alih status">
                <Table.ScrollContainer>
                    <Table.Content>
                        <Table.Header className="sticky top-0 z-10">
                            {table.getFlatHeaders().map((header) => (
                                <Table.Column key={header.id} isRowHeader style={{
                                    width: header.getSize(),
                                }}>
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
                                        Tidak ada data yang cocok dengan filter.
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                rows.map((row) => (
                                    <Table.Row key={row.id}>
                                        {row.getAllCells().map((cell) => (
                                            <Table.Cell key={cell.id} style={{
                                                width: cell.column.getSize(),
                                            }}>
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