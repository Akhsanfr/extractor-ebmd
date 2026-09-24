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
} from "@heroui/react";
import {
    createColumnHelper,
    flexRender,
    tableFeatures,
    useTable,
    columnSizingFeature,
    columnFilteringFeature,
    createFilteredRowModel,
    filterFn_includesString,
    filterFn_equalsString,
    type Column,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import { ReactNode, useMemo, useState } from "react";
import { TableCellStack } from "./data/tableCellStack";
import { Table } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";
import { AlihStatusType } from "@/enum/alihStatus";
const features = tableFeatures({
    columnSizingFeature,
    columnFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: {
        includesString: filterFn_includesString,
        equalsString: filterFn_equalsString,
    },
});
const columnHelper = createColumnHelper<typeof features, AlihStatusPermohonanContract.SelectDTO>();

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
    const isKosong = !data || data.length === 0;

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

function RenderTable({
    data,
    rowAction,
}: {
    data: AlihStatusPermohonanContract.SelectDTO[];
    rowAction?: (row: AlihStatusPermohonanContract.SelectDTO) => void;
}) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
        },
        onColumnFiltersChange: setColumnFilters,
    });

    const rows = table.getRowModel().rows;

    return (
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
    );
}