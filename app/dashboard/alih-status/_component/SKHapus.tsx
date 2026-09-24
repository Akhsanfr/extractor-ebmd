import { Description } from "@/component/description";
import { Alert, Label } from "@heroui/react";
import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ReactNode, useMemo } from "react";
import { TableCellStack } from "./data/tableCellStack";
import { Table } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusSKHapusContract } from "@/action/alih-status/sk-hapus/contract";
const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, AlihStatusSKHapusContract.SelectDTO>();
export default function DetailSKHapus({
    data,
    isLoading,
    action,
    rowAction,
    shouldTable = false,
}: {
    data: AlihStatusSKHapusContract.SelectDTO[],
    isLoading: boolean,
    action?: ReactNode,
    rowAction?: (row: AlihStatusSKHapusContract.SelectDTO) => void;
    shouldTable?: boolean
}) {

    const isJamak = (data?.length ?? 0) > 1;
    const isKosong = !data || data.length === 0;

    return (
        <>
            <div className="flex justify-between items-center">
                <Label>SK Hapus Alih Status</Label>
                {action}
            </div>
            {
                isLoading ? <Loading /> :
                    isKosong ? (
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Belum ada dokumen SK Hapus</Alert.Title>
                                {
                                    action &&
                                    <Alert.Description>Buat SK Hapus dengan klik tombol tambah diatas</Alert.Description>}
                            </Alert.Content>
                        </Alert>
                    ) : isJamak || shouldTable ? (
                        <RenderTable data={data!} rowAction={rowAction} />
                    ) : (
                        <Description items={[
                            {
                                label: "Nomor Surat",
                                value: data[0].suratNomor
                            },
                            {
                                label: "Tanggal Surat",
                                value: data[0].suratTanggal
                            }
                        ]} />
                    )}
        </>
    );
}
function RenderTable({
    data,
    rowAction,
}: {
    data: AlihStatusSKHapusContract.SelectDTO[];
    rowAction?: (row: AlihStatusSKHapusContract.SelectDTO) => void;
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
                            ctx.row.original.suratHal,
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
