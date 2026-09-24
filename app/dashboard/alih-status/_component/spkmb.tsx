import { Description } from "@/component/description";
import { Alert, ButtonGroup, Chip, Label } from "@heroui/react";
import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ReactNode, useMemo } from "react";
import { TableCellStack } from "./data/tableCellStack";
import { Table } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusSPKMBContract } from "@/action/alih-status/spkmb/contract";
const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, AlihStatusSPKMBContract.SelectDTO>();
export default function DetailSPKMB({
    data,
    isLoading,
    action,
    rowAction,
    shouldTable = false,
}: {
    data: AlihStatusSPKMBContract.SelectDTO[],
    isLoading: boolean,
    action?: ReactNode,
    rowAction?: (row: AlihStatusSPKMBContract.SelectDTO) => void;
    shouldTable?: boolean
}) {

    const isJamak = (data?.length ?? 0) > 1;
    const isKosong = !data || data.length === 0;

    return (
        <>
            <div className="flex justify-between items-center">
                <Label>Surat Pernyataan Kesediaan Menerima Barang</Label>
                {action}
            </div>
            {
                isLoading ? <Loading /> :
                    isKosong ? (
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Belum ada dokumen Surat Pernyataan Kesediaan Menerima Barang</Alert.Title>
                                {
                                    action &&
                                    <Alert.Description>Buat Surat Pernyataan Kesediaan Menerima Barang dengan klik tombol tambah diatas</Alert.Description>}
                            </Alert.Content>
                        </Alert>
                    ) : isJamak || shouldTable ? (
                        <RenderTable data={data!} rowAction={rowAction} />
                    ) : (
                        <Description
                            items={[
                                {
                                    label: "ID",
                                    value: `# ${data![0].id}`,
                                }
                                ,
                                [
                                    {
                                        label: "Nomor Surat",
                                        value: data![0].suratNomor,
                                    },
                                    {
                                        label: "Tanggal Surat",
                                        value: data![0].suratTanggal,
                                    }
                                ],
                                {
                                    label: "Perangkat Daerah Asal",
                                    value: data![0].perangkatDaerahTujuan,
                                },
                                [
                                    {
                                        label: "Pengguna Barang Asal",
                                        value: data![0].penggunaBarangTujuanNama,
                                    },
                                    {
                                        label: "Pangkat Pengguna Barang Tujuan",
                                        value: data![0].penggunaBarangTujuanPangkat,
                                    }
                                ],
                                {
                                    label: "NIP Pengguna Barang Tujuan",
                                    value: data![0].penggunaBarangTujuanNIP,
                                },
                            ]}
                        />
                    )}
        </>
    );
}
function RenderTable({
    data,
    rowAction,
}: {
    data: AlihStatusSPKMBContract.SelectDTO[];
    rowAction?: (row: AlihStatusSPKMBContract.SelectDTO) => void;
}) {
    const columns = useMemo(() => {
        const cols = columnHelper.columns([
            columnHelper.accessor("id", { header: "ID", cell: (ctx) => `# ${ctx.row.original.id}` }),
            columnHelper.display({
                id: "no",
                header: "No",
                cell: ({ row }) => row.index + 1,
            }),
            columnHelper.accessor("perangkatDaerahTujuan", {
                header: "Perangkat Daerah Tujuan",
                cell: ({ row }) => (
                    <TableCellStack columns={[row.original.perangkatDaerahTujuan]} />
                ),
            }),
            columnHelper.accessor("penggunaBarangTujuanNama", {
                header: "Jabatan",
                cell: ({ row }) => (
                    <TableCellStack columns={[row.original.penggunaBarangTujuanNama, row.original.penggunaBarangTujuanNIP, row.original.penggunaBarangTujuanPangkat]} />
                ),
            }),
            columnHelper.accessor("isComplete", {
                header: "Status",
                cell: ({ row }) => (
                    <TableCellStack columns={[row.original.isComplete ? <Chip>Lengkap</Chip> : <Chip variant="soft">Belum Lengkap</Chip>]} />
                ),
            }),
        ]);

        if (rowAction) {
            cols.push(
                columnHelper.display({
                    id: "aksi",
                    header: "Aksi",
                    cell: (ctx) => rowAction(ctx.row.original),
                })
            );
        }

        return cols;
    }, [rowAction]);

    const table = useTable({ features, columns, data });
    const rows = table.getRowModel().rows;

    return (
        <Table aria-label="Tabel data alih status">
            <Table.ScrollContainer>
                <Table.Content>
                    <Table.Header className="sticky top-0 z-10">
                        {table.getFlatHeaders().map((header) => (
                            <Table.Column key={header.id} isRowHeader>
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
                                    <Table.Cell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    );
}
