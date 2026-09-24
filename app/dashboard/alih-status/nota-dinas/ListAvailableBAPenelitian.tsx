"use client";

import type { Selection } from "@heroui/react";

import { Checkbox, Table } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { memo, useEffect, useMemo, useState } from "react";
import { $year } from "@/state/year.store";
import { actionGetListAlihStatusBAPenelitianForAvailableNodin } from "@/action/alih-status/ba-penelitian/action.read";
import { AlihStatusBAPenelitianContract } from "@/action/alih-status/ba-penelitian/contract";


export default memo(function ListAvailableBAPenelitian({ onChange }: { onChange: (BAPenelitians: AlihStatusBAPenelitianContract.SelectDTO[]) => void }) {
    const QUERY_KEY = ["alih-status", "data", "available", "ba-penelitian"];
    const tahun = useStore($year);

    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

    const query = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih");
            const res = await actionGetListAlihStatusBAPenelitianForAvailableNodin(
                Number(tahun),
            );
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
        refetchOnMount: "always",
    });

    const data = query.data ?? [];

    // normalisasi selectedKeys -> array id (number)
    const selectedIds = useMemo(() => {
        if (selectedKeys === "all") return data.map((row) => row.id);
        return Array.from(selectedKeys, (key) => Number(key));
    }, [selectedKeys, data]);

    // kirim hasil checked ke parent setiap kali seleksi berubah
    useEffect(() => {
        if (selectedIds.length === 0) {
            return;
        }
        onChange(query.data?.filter((row) => selectedIds.includes(row.id)) ?? []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIds]);

    // reset seleksi kalau tahun berganti
    useEffect(() => {
        setSelectedKeys(new Set());
    }, [tahun]);

    return (
        <Table aria-label="Tabel BAPenelitian tersedia">
            <Table.ScrollContainer>
                <Table.Content
                    aria-label="Tabel BAPenelitian tersedia"
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
                        <Table.Column id="perangkatDaerahAsal">
                            Perangkat Daerah Asal
                        </Table.Column>
                        <Table.Column id="Nomor Surat">
                            Nomor Surat
                        </Table.Column>
                        <Table.Column id="Tanggal Surat">
                            Tanggal Surat
                        </Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {data.map((item) => (
                            <Table.Row key={item.id} id={item.id}>
                                <Table.Cell className="pe-0">
                                    <Checkbox
                                        aria-label={`Pilih BAPenelitian #${item.id}`}
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
                                <Table.Cell>{item.perangkatDaerahAsal}</Table.Cell>
                                <Table.Cell>{item.suratNomor}</Table.Cell>
                                <Table.Cell>{item.suratTanggal}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    );
})