"use client";

import type { Selection } from "@heroui/react";

import { Checkbox, Skeleton, Table, TableCell } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { $year } from "@/state/year.store";
import { actionGetListAlihStatusData } from "@/action/alih-status/data/action.read";
import { TableHeaderStack } from "./data/tableHeaderStack";
import { TableCellStack } from "./data/tableCellStack";
import { formatRupiah } from "@/lib/number";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";

// referensi array kosong yang stabil — hindari membuat `[]` baru di setiap
// render (yang akan selalu punya reference berbeda dan memicu effect terus
// menerus selama query.data belum ada / masih undefined)
const EMPTY_DATA: AlihStatusDataContract.SelectDTO[] = [];

export default memo(function ListAvailableData({
    column,
    values,
    onChange,
}: {
    column: keyof AlihStatusDataContract.QueryDTO;
    values: number[];
    onChange: (data: AlihStatusDataContract.SelectDTO[]) => void;
}) {
    const QUERY_KEY = ["alih-status", "data", "available", "persetujuan-bupati", column];
    const tahun = useStore($year);

    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

    // simpan onChange di ref supaya effect di bawah tidak perlu depend pada
    // identitas fungsi onChange (yang biasanya inline arrow function di parent
    // dan berubah setiap parent re-render). Tanpa ini, effect akan terus
    // memicu setState di parent -> parent re-render -> onChange baru -> effect
    // jalan lagi -> infinite loop ("Maximum update depth exceeded").
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const query = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih");
            if (!values || values.length === 0) throw new Error("Nodin ID belum dipilih");
            const res = await actionGetListAlihStatusData({
                [column]: values
            });
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
        enabled: values.length > 0,
        refetchOnMount: "always",
    });

    const data = query.data ?? EMPTY_DATA;

    // normalisasi selectedKeys -> array id (number)
    const selectedIds = useMemo(() => {
        if (selectedKeys === "all") return data.map((row) => row.id);
        return Array.from(selectedKeys, (key) => Number(key));
    }, [selectedKeys, data]);

    // kirim hasil checked ke parent setiap kali seleksi berubah
    // (hanya depend pada selectedIds & data, BUKAN pada onChange)
    useEffect(() => {
        const selectedData = data.filter((row) => selectedIds.includes(row.id));
        onChangeRef.current(selectedData);
    }, [selectedIds, data]);

    // reset seleksi kalau BAPenelitian berganti (data lama sudah tidak relevan)
    useEffect(() => {
        setSelectedKeys(new Set());
    }, [values]);

    if (query.isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-3 w-1/3 rounded-lg" />
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
            </div>
        );
    }

    return (
        <Table aria-label="Tabel data tersedia">
            <Table.ScrollContainer className="h-[500]">
                <Table.Content
                    aria-label="Tabel data tersedia"
                    selectedKeys={selectedKeys}
                    selectionMode="multiple"
                    onSelectionChange={setSelectedKeys}
                >
                    <Table.Header>
                        <Table.Column className="pe-0">
                            <Checkbox aria-label="Pilih semua" slot="selection">
                                <Checkbox.Content>
                                    <Checkbox.Control>
                                        <Checkbox.Indicator />
                                    </Checkbox.Control>
                                </Checkbox.Content>
                            </Checkbox>
                        </Table.Column>

                        <Table.Column isRowHeader id="id">
                            ID
                        </Table.Column>

                        <Table.Column>
                            <TableHeaderStack columns={["Jenis BMD"]} />
                        </Table.Column>

                        <Table.Column>
                            <TableHeaderStack columns={["Nama Barang", "Kode Barang"]} />
                        </Table.Column>

                        <Table.Column>
                            <TableHeaderStack columns={["NIBAR", "Register"]} />
                        </Table.Column>

                        <Table.Column>
                            <TableHeaderStack columns={["Merk / Tipe"]} />
                        </Table.Column>

                        <Table.Column>
                            <TableHeaderStack
                                columns={[
                                    "Nomor Polisi",
                                    "Nomor Rangka",
                                    "Nomor Mesin",
                                ]}
                            />
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
                            <TableHeaderStack
                                columns={[
                                    "Nilai Perolehan",
                                    "Akumulasi Penyusutan",
                                    "Nilai Buku",
                                ]}
                            />
                        </Table.Column>

                        <Table.Column>
                            <TableHeaderStack
                                columns={[
                                    "Perangkat Daerah Asal",
                                    "Perangkat Daerah Tujuan",
                                ]}
                            />
                        </Table.Column>
                    </Table.Header>

                    <Table.Body>
                        {data.map((item) => (
                            <Table.Row key={item.id} id={String(item.id)}>
                                <Table.Cell className="pe-0">
                                    <Checkbox
                                        aria-label={`Pilih data #${item.id}`}
                                        slot="selection"
                                    >
                                        <Checkbox.Content>
                                            <Checkbox.Control>
                                                <Checkbox.Indicator />
                                            </Checkbox.Control>
                                        </Checkbox.Content>
                                    </Checkbox>
                                </Table.Cell>

                                <Table.Cell className="font-medium">
                                    # {item.id}
                                </Table.Cell>

                                <Table.Cell>
                                    <TableCellStack
                                        columns={[
                                            item.assetType
                                        ]}
                                    />
                                </Table.Cell>

                                <Table.Cell>
                                    <TableCellStack
                                        columns={[
                                            item.namaBarangKategori,
                                            item.kodeBarang,
                                        ]}
                                    />
                                </Table.Cell>

                                <Table.Cell>
                                    <TableCellStack
                                        columns={[
                                            item.nibar,
                                            item.kodeRegister,
                                        ]}
                                    />
                                </Table.Cell>

                                <Table.Cell>
                                    <TableCellStack columns={[item.merkTipe]} />
                                </Table.Cell>

                                <Table.Cell>
                                    <TableCellStack
                                        columns={[
                                            item.nomorPolisi,
                                            item.nomorRangka,
                                            item.nomorMesin,
                                        ]}
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
                                    <TableCellStack
                                        columns={[
                                            item.perangkatDaerahAsal,
                                            item.perangkatDaerahTujuan,
                                        ]}
                                    />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    );
});