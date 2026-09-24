import { Description } from "@/component/description";
import { Alert, Label } from "@heroui/react";
import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ReactNode, useMemo } from "react";
import { TableCellStack } from "./data/tableCellStack";
import { Table } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract";
const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, AlihStatusPersetujuanBupatiContract.SelectDTO>();
export default function DetailPersetujuanBupati({
    data,
    isLoading,
    action,
    rowAction,
    shouldTable = false,
}: {
    data: AlihStatusPersetujuanBupatiContract.SelectDTO[],
    isLoading: boolean,
    action?: ReactNode,
    rowAction?: (row: AlihStatusPersetujuanBupatiContract.SelectDTO) => void;
    shouldTable?: boolean
}) {

    const isJamak = (data?.length ?? 0) > 1;
    const isKosong = !data || data.length === 0;

    return (
        <>
            <div className="flex justify-between items-center">
                <Label>Persetujuan Bupati Alih Status</Label>
                {action}
            </div>
            {
                isLoading ? <Loading /> :
                    isKosong ? (
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Belum ada dokumen Persetujuan Bupati</Alert.Title>
                                {
                                    action &&
                                    <Alert.Description>Buat Persetujuan Bupati dengan klik tombol tambah diatas</Alert.Description>}
                            </Alert.Content>
                        </Alert>
                    ) : isJamak || shouldTable ? (
                        <RenderTable data={data!} rowAction={rowAction} />
                    ) : (
                        <Description items={[
                            {
                                label: "Tipe Alih Status",
                                value: data[0].alihStatusType
                            },
                            {
                                label: "Nomor Surat",
                                value: data[0].suratNomor
                            },
                            {
                                label: "Hal Surat",
                                value: data[0].suratHal
                            },
                            {
                                label: "Tanggal Surat",
                                value: data[0].suratTanggal
                            },
                        ]} />
                    )}
        </>
    );
}
function RenderTable({
    data,
    rowAction,
}: {
    data: AlihStatusPersetujuanBupatiContract.SelectDTO[];
    rowAction?: (row: AlihStatusPersetujuanBupatiContract.SelectDTO) => void;
}) {
    const columns = useMemo(() => {
        const cols = columnHelper.columns([
            columnHelper.accessor("id", { header: "ID", cell: (ctx) => `# ${ctx.row.original.id}` }),
            columnHelper.accessor("alihStatusType", { header: "Jenis Alih Status" }),
            columnHelper.accessor("suratNomor", {
                header: "Nomor Surat",
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
