import { Description } from "@/component/description";
import { Alert, Label } from "@heroui/react";
import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ReactNode, useMemo } from "react";
import { TableCellStack } from "./data/tableCellStack";
import { Table } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusBASTContract } from "@/action/alih-status/bast/contract";
import { TableHeaderStack } from "./data/tableHeaderStack";
const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, AlihStatusBASTContract.SelectDTO>();
export default function DetailBAST({
    data,
    isLoading,
    action,
    rowAction,
    shouldTable = false,
}: {
    data: AlihStatusBASTContract.SelectDTO[],
    isLoading: boolean,
    action?: ReactNode,
    rowAction?: (row: AlihStatusBASTContract.SelectDTO) => void;
    shouldTable?: boolean
}) {

    const isJamak = (data?.length ?? 0) > 1;
    const isKosong = !data || data.length === 0;

    return (
        <>
            <div className="flex justify-between items-center">
                <Label>Berita Acara Serah Terima Alih Status</Label>
                {action}
            </div>
            {
                isLoading ? <Loading /> :
                    isKosong ? (
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Belum ada dokumen BAST</Alert.Title> {
                                    action &&
                                    <Alert.Description>Buat BAST dengan klik tombol tambah diatas</Alert.Description>}
                            </Alert.Content>
                        </Alert>
                    ) : isJamak || shouldTable ? (
                        <RenderTable data={data!} rowAction={rowAction} />
                    ) : (
                        <Description items={[
                            [{
                                label: "ID",
                                value: `# ${data[0].id}`
                            },
                            {
                                label: "Tahun",
                                value: data[0].tahun
                            }],
                            [{
                                label: "Nomor Surat",
                                value: data[0].suratNomor
                            },
                            {
                                label: "Tanggal Surat",
                                value: data[0].suratTanggal
                            }], {
                                label: "Perangkat Daerah Asal",
                                value: data![0].perangkatDaerahAsal,
                            },
                            [
                                {
                                    label: "Pengguna Barang Asal",
                                    value: data![0].penggunaBarangAsalNama,
                                },
                                {
                                    label: "Pangkat Pengguna Barang Asal",
                                    value: data![0].penggunaBarangAsalPangkat,
                                }
                            ], [
                                {
                                    label: "NIP Pengguna Barang Asal",
                                    value: data![0].penggunaBarangAsalNIP,
                                },
                                {
                                    label: "Jabatan Pengguna Barang Asal",
                                    value: data![0].penggunaBarangAsalJabatan,
                                }
                            ], {
                                label: "Perangkat Daerah Tujuan",
                                value: data![0].perangkatDaerahTujuan,
                            },
                            [
                                {
                                    label: "Pengguna Barang Tujuan",
                                    value: data![0].penggunaBarangTujuanNama,
                                },
                                {
                                    label: "Pangkat Pengguna Barang Tujuan",
                                    value: data![0].penggunaBarangTujuanPangkat,
                                }
                            ], [
                                {
                                    label: "NIP Pengguna Barang Tujuan",
                                    value: data![0].penggunaBarangTujuanNIP,
                                },
                                {
                                    label: "Jabatan Pengguna Barang Tujuan",
                                    value: data![0].penggunaBarangTujuanJabatan,
                                }
                            ]
                        ]} />
                    )}
        </>
    );
}
function RenderTable({
    data,
    rowAction,
}: {
    data: AlihStatusBASTContract.SelectDTO[];
    rowAction?: (row: AlihStatusBASTContract.SelectDTO) => void;
}) {
    const columns = useMemo(() => {
        const cols = columnHelper.columns([
            columnHelper.accessor("id", { header: "ID", cell: (ctx) => `# ${ctx.row.original.id}` }),
            columnHelper.accessor("suratNomor", {
                header: "Nomor Surat",
                cell: (ctx) => (
                    <TableCellStack
                        columns={[
                            ctx.row.original.suratNomor,
                            ctx.row.original.suratTanggal,
                        ]}
                    />
                ),
            }),
            columnHelper.accessor("perangkatDaerahAsal", {
                header: "Asal Perangkat Daerah",
            }),
            columnHelper.accessor("penggunaBarangAsalNama", {
                header: (e) => <TableHeaderStack columns={["Pengguna Barang Asal", "NIP", "Pangkat", "Golongan"]} />,
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
            }), columnHelper.accessor("perangkatDaerahTujuan", {
                header: "Tujuan Perangkat Daerah",
            }),
            columnHelper.accessor("penggunaBarangTujuanNama", {
                header: (e) => <TableHeaderStack columns={["Pengguna Barang Tujuan", "NIP", "Pangkat", "Golongan"]} />,
                cell: (ctx) => (
                    <TableCellStack
                        columns={[
                            ctx.row.original.penggunaBarangTujuanNama,
                            ctx.row.original.penggunaBarangTujuanNIP,
                            ctx.row.original.penggunaBarangTujuanPangkat,
                            ctx.row.original.penggunaBarangTujuanJabatan,
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
