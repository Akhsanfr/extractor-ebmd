import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { formatRupiah } from "@/lib/number";
import { Table } from "@heroui/react";
import Decimal from "decimal.js";
import { ReactNode } from "react";

export function TableCellStack({ columns }: { columns: (ReactNode | null | undefined)[] }) {
    const [kolom1, ...rest] = columns;

    return (
        <div className="flex flex-col">
            <span>{kolom1}</span>
            {rest.map((kolom, i) => (
                <span key={i} className="text-muted text-xs">
                    {kolom}
                </span>
            ))}
        </div>
    );
}

export function TableHeaderStack({ columns }: { columns: ReactNode[] }) {
    const [kolom1, ...rest] = columns;

    return (
        <div className="flex flex-col text-center">
            <span className="font-bold">{kolom1}</span>
            {rest.map((kolom, i) => (
                <span key={i} className="text-default-400 text-xs">
                    {kolom}
                </span>
            ))}
        </div>
    );
}

// Total dihitung pakai decimal.js agar tidak kena floating point error saat sum rupiah
export function sumDecimal(data: AlihStatusDataContract.SelectDTO[], key: "jumlah" | "nilaiPerolehan" | "akumulasiPenyusutan" | "nilaiBuku") {
    return data
        .reduce((acc, item) => acc.plus(new Decimal(item[key] ?? 0)), new Decimal(0))
        .toNumber();
}

export function AlihStatusTabelData({
    data,
    headerAction,
    bodyAction,
}: {
    data: AlihStatusDataContract.SelectDTO[];
    headerAction?: ReactNode;
    bodyAction?: ({ item }: { item: AlihStatusDataContract.SelectDTO }) => ReactNode;
}) {
    const totalJumlah = sumDecimal(data, "jumlah");
    const totalNilaiPerolehan = sumDecimal(data, "nilaiPerolehan");
    const totalAkumulasiPenyusutan = sumDecimal(data, "akumulasiPenyusutan");
    const totalNilaiBuku = sumDecimal(data, "nilaiBuku");

    return (
        <Table aria-label="Tabel data alih status">
            <Table.ScrollContainer className="max-h-screen">
                <Table.Content aria-label="Tabel data alih status">
                    <Table.Header className="sticky top-0 z-10">
                        <Table.Column isRowHeader>
                            <TableHeaderStack columns={["Nama Barang", "Kode Barang"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["NIBAR", "Register"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Merk / Tipe"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Nomor Polisi", "Nomor Rangka", "Nomor Mesin"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Kondisi"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Lokasi"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Tahun"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Asal Usul"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Jumlah"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Nilai Perolehan", "Akumulasi Penyusutan", "Nilai Buku"]} />
                        </Table.Column>
                        <Table.Column>
                            <TableHeaderStack columns={["Perangkat Daerah Asal", "Perangkat Daerah Tujuan"]} />
                        </Table.Column>
                        {headerAction}
                    </Table.Header>
                    <Table.Body>
                        {data.map((item) => (
                            <Table.Row key={item.id}>
                                <Table.Cell>
                                    <TableCellStack columns={[item.namaBarangKategori, item.kodeBarang]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.nibar, item.kodeRegister]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.merkTipe]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack
                                        columns={[item.nomorPolisi, item.nomorRangka, item.nomorMesin]}
                                    />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.kondisi]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.lokasi]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.tahun]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.asalUsul]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.jumlah]} />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack
                                        columns={[
                                            formatRupiah(item.nilaiPerolehan),
                                            formatRupiah(item.akumulasiPenyusutan),
                                            formatRupiah(item.nilaiBuku),
                                        ]}
                                    />
                                </Table.Cell>
                                <Table.Cell>
                                    <TableCellStack columns={[item.perangkatDaerahAsal, item.perangkatDaerahTujuan]} />
                                </Table.Cell>
                                {bodyAction && bodyAction({ item })}
                            </Table.Row>
                        ))}

                        {/* Footer total — baris ini tepat 1 baris setelah baris data terakhir */}
                        <Table.Row key="total-row" className="font-bold bg-default-100">
                            <Table.Cell colSpan={8}>
                                <span className="font-bold">Total</span>
                            </Table.Cell>
                            <Table.Cell>
                                <span className="font-bold">{totalJumlah}</span>
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex flex-col font-bold">
                                    <span>{formatRupiah(totalNilaiPerolehan)}</span>
                                    <span>{formatRupiah(totalAkumulasiPenyusutan)}</span>
                                    <span>{formatRupiah(totalNilaiBuku)}</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell />
                            {bodyAction && <Table.Cell />}
                        </Table.Row>
                    </Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    );
}