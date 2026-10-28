"use client";
import { useCallback, useMemo, useState } from "react";
import { Alert, Card, Chip, Label, ListBox, Select, Tabs, type Key } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { actionGetListRekon } from "@/action/rekon/action.read";
import Loading from "@/component/loading";
import type { RekonBerkasTipe } from "./rekonBerkas";
import RekonBerkasModal from "./rekonBerkasModal";
import RekonEditModal from "./rekonEditModal";
import RekonImportModal from "./rekonImportModal";
import RekonShell from "./rekonShell";
import RekonSummary from "./rekonSummary";
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

function RekonBody() {
    const tahunOptions = useMemo(() => getTahunOptions(), []);

    // Filter disimpan di sini, jadi tetap terjaga saat pengguna berinteraksi dengan tabel.
    const [tahun, setTahun] = useState<number | undefined>(tahunOptions[tahunOptions.length - 1]);
    const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
    const [rekonType, setRekonType] = useState<RekonType>(RekonType.ASET_TETAP);
    const [editTarget, setEditTarget] = useState<RekonRow | null>(null);
    // Yang disimpan hanya identitas (id + tipe); datanya selalu dibaca dari cache query.
    const [berkasTarget, setBerkasTarget] = useState<{ id: RekonRow["id"]; tipe: RekonBerkasTipe } | null>(null);
    const openBerkas = useCallback(
        (row: RekonRow, tipe: RekonBerkasTipe) => setBerkasTarget({ id: row.id, tipe }),
        [],
    );

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

    const berkasRow = berkasTarget ? query.data?.find((r) => r.id === berkasTarget.id) : undefined;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <header className="flex flex-wrap items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                    <Scale size={22} />
                </span>
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">Rekon Realisasi &amp; Input BMD</h1>
                    <p className="text-sm text-muted">
                        Bandingkan realisasi anggaran dengan input BMD untuk setiap perangkat daerah.
                    </p>
                </div>
                <div className="ml-auto">
                    <RekonImportModal tahun={tahun} bulan={bulan} />
                </div>
            </header>

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

            {/* Filter */}
            <Card className="border border-border">
                <Card.Content className="flex flex-row flex-wrap items-end gap-4 p-4">
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

                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Jenis rekon</span>
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
                    </div>
                </Card.Content>
            </Card>

            {/* Ringkasan */}
            <RekonSummary data={query.data} />

            {/* Tabel */}
            <Card className="border border-border">
                <Card.Header className="flex-row items-center justify-between gap-3">
                    <div>
                        <Card.Title className="text-base">{REKON_TYPE_LABEL[rekonType]}</Card.Title>
                        <Card.Description>
                            {BULAN_LABEL[bulan - 1]} {tahun ?? "—"}
                        </Card.Description>
                    </div>
                    {query.data && (
                        <Chip color="accent" variant="soft" size="sm">
                            <Chip.Label>{query.data.length} perangkat daerah</Chip.Label>
                        </Chip>
                    )}
                </Card.Header>
                <Card.Content>
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
                        <RekonTable data={query.data ?? []} onEdit={setEditTarget} onOpenBerkas={openBerkas} />
                    )}
                </Card.Content>
            </Card>

            {berkasRow && berkasTarget && (
                <RekonBerkasModal
                    key={`${berkasTarget.id}-${berkasTarget.tipe}`}
                    row={berkasRow}
                    tipe={berkasTarget.tipe}
                    queryKey={queryKey}
                    onClose={() => setBerkasTarget(null)}
                />
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

// Halaman dirender tanpa layout induk, jadi dibungkus shell (header, latar, footer).
export default function RekonContent() {
    return (
        <RekonShell>
            <RekonBody />
        </RekonShell>
    );
}