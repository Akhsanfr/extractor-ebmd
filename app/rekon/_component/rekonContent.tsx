"use client";
import { useMemo, useState } from "react";
import { Alert, Label, ListBox, Select, Tabs, type Key } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { actionGetListRekon } from "@/action/rekon/action.read";
import Loading from "@/component/loading";
import RekonEditModal from "./rekonEditModal";
import RekonImportModal from "./rekonImportModal";
import RekonTable from "./rekonTable";
import {
    BULAN_LABEL,
    REKON_QUERY_KEY,
    REKON_TYPE_LABEL,
    getErrorMessage,
    getTahunOptions,
    isRekonType,
    type RekonRow,
} from "./rekonUtil";
import { RekonType } from "@/enum/rekon";

export default function RekonContent() {
    const tahunOptions = useMemo(() => getTahunOptions(), []);

    // Filter disimpan di sini, jadi tetap terjaga saat pengguna berinteraksi dengan tabel.
    const [tahun, setTahun] = useState<number | undefined>(tahunOptions[tahunOptions.length - 1]);
    const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
    const [rekonType, setRekonType] = useState<RekonType>(RekonType.ASET_TETAP);
    const [editTarget, setEditTarget] = useState<RekonRow | null>(null);

    const queryKey = [...REKON_QUERY_KEY, tahun, bulan, rekonType] as const;
    const query = useQuery({
        queryKey,
        enabled: tahun !== undefined,
        queryFn: async () => {
            if (tahun === undefined) throw new Error("Tahun belum ditentukan");
            const res = await actionGetListRekon({ tahun, bulan, rekonType });
            if (!res.success) throw res.error;
            return res.data;
        },
    });

    return (
        <div className="flex flex-col gap-4">
            {tahun === undefined && (
                <Alert status="warning">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Tahun belum tersedia</Alert.Title>
                        <Alert.Description>
                            Belum ada tahun yang dapat dipilih, jadi data rekon belum bisa ditampilkan.
                        </Alert.Description>
                    </Alert.Content>
                </Alert>
            )}

            <div className="flex flex-row flex-wrap items-end gap-3">
                <Select
                    className="w-32"
                    placeholder="Pilih tahun"
                    value={tahun === undefined ? undefined : String(tahun)}
                    onChange={(key: Key | null) => key && setTahun(Number(key))}
                >
                    <Label>Tahun</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {tahunOptions.map((t) => (
                                <ListBox.Item key={t} id={String(t)} textValue={String(t)}>
                                    {t}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Select
                    className="w-44"
                    value={String(bulan)}
                    onChange={(key: Key | null) => key && setBulan(Number(key))}
                >
                    <Label>Bulan</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {BULAN_LABEL.map((label, i) => (
                                <ListBox.Item key={label} id={String(i + 1)} textValue={label}>
                                    {label}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Tabs
                    selectedKey={rekonType}
                    onSelectionChange={(key: Key) => {
                        if (isRekonType(key)) setRekonType(key);
                    }}
                >
                    <Tabs.ListContainer>
                        <Tabs.List aria-label="Jenis rekon">
                            {Object.values(RekonType).map((type) => (
                                <Tabs.Tab key={type} id={type}>
                                    {REKON_TYPE_LABEL[type]}
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>

                <div className="ml-auto">
                    <RekonImportModal tahun={tahun} bulan={bulan} />
                </div>
            </div>

            {query.isError ? (
                <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Gagal memuat data rekon</Alert.Title>
                        <Alert.Description>{getErrorMessage(query.error)}</Alert.Description>
                    </Alert.Content>
                </Alert>
            ) : query.isLoading ? (
                <Loading />
            ) : (
                <RekonTable data={query.data ?? []} onEdit={setEditTarget} />
            )}

            {editTarget && (
                <RekonEditModal
                    key={editTarget.id}
                    target={editTarget}
                    queryKey={queryKey}
                    onClose={() => setEditTarget(null)}
                />
            )}
        </div>
    );
}
