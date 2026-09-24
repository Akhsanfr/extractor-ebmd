"use client";

import type { Selection } from "@heroui/react";

import { Checkbox, Table } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { memo, useEffect, useMemo, useState } from "react";
import { $year } from "@/state/year.store";
import { actionGetListAlihStatusPermohonanPenghapusanForAvailableSKHapus } from "@/action/alih-status/permohonan-penghapusan/action.read";
import { AlihStatusPermohonanPenghapusanContract } from "@/action/alih-status/permohonan-penghapusan/contract";


export default memo(function ListAvailablePermohonanPenghapusan({ onChange }: { onChange: (PermohonanPenghapusan: AlihStatusPermohonanPenghapusanContract.SelectDTO[]) => void }) {
    const QUERY_KEY = ["alih-status", "data", "available", "permohonan-penghapusan"];
    const tahun = useStore($year);

    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

    const query = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih");
            const res = await actionGetListAlihStatusPermohonanPenghapusanForAvailableSKHapus(
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
        <Table aria-label="Tabel Permohonan Penghapusan tersedia">
            <Table.ScrollContainer>
                <Table.Content
                    aria-label="Tabel Permohonan Penghapusan tersedia"
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
                                        aria-label={`Pilih PermohonanPenghapusan #${item.id}`}
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