"use client";
import { useCallback, useMemo, useState } from "react";
import { Alert, Button, Card, Chip, Dropdown, Label, ListBox, Select, Tabs, toast, type Key } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Scale } from "lucide-react";
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
import { filterRekonRows, getPerangkatDaerahOptions, useRekonFilters } from "./useRekonFilters";
import { getPerangkatDaerahAction } from "@/action/perangkatDaerah/action";
import RekonFilterBar from "./rekonFilterBar";

// Link template berupa spreadsheet; ganti href dengan link yang sebenarnya.
const TEMPLATE_REKON = [
    { id: "kk-aset-tetap", label: "KK Aset Tetap", href: "https://docs.google.com/spreadsheets/d/1zX5sWig-6WhNVaOoX7k7v890CH0cfYGUKlmp2YkAApQ/edit?usp=drive_link" },
    { id: "kk-persediaan", label: "KK Persediaan", href: "https://docs.google.com/spreadsheets/d/1Eq0JivGm9GsMK-2EKe02Y5IwhmiqS6sZVVWMOxnP9Jo/edit?usp=drive_link" },
    { id: "kk-pemeliharaan", label: "KK Pemeliharaan", href: "https://docs.google.com/spreadsheets/d/1jsjJaEw48z_gfc9PY6vuqTlRJVtaJNwn77C-avx9dls/edit?usp=drive_link" },
] as const;

const ACTION_SURAT_LHR = "draft-surat-lhr";

async function fetchRekonList(tahun: number, bulan: number, rekonType: RekonType) {
    const res = await actionGetListRekon({ tahun, bulan, rekonType });
    if (!res.success) throw res.error;
    return res.data;
}

function RekonBody() {
    const queryClient = useQueryClient();
    const tahunOptions = useMemo(() => getTahunOptions(), []);

    // Filter disimpan di sini, jadi tetap terjaga saat pengguna berinteraksi dengan tabel.
    const [tahun, setTahun] = useState<number | undefined>(tahunOptions[tahunOptions.length - 1]);
    const [bulan, setBulan] = useState(9);
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
            return fetchRekonList(tahun, bulan, rekonType);
        },
    });

    // Draft surat butuh data ketiga jenis rekon pada periode terpilih, bukan hanya tab yang aktif.
    const draftSuratMutation = useMutation({
        mutationFn: async () => {
            if (tahun === undefined) throw new Error("Tahun belum ditentukan");
            const fetchType = (type: RekonType) =>
                queryClient.fetchQuery({
                    queryKey: [...REKON_QUERY_KEY, tahun, bulan, type],
                    queryFn: () => fetchRekonList(tahun, bulan, type),
                });
            const [asetTetap, persediaan, pemeliharaan] = await Promise.all([
                fetchType(RekonType.ASET_TETAP),
                fetchType(RekonType.PERSEDIAAN),
                fetchType(RekonType.PEMELIHARAAN),
            ]);
            toast.info("Fitur ini masih dalam tahap pengembangan");
            // generateDraftSuratLhr({ asetTetap, persediaan, pemeliharaan }, { tahun, bulan });
        },
        onError: (error) => {
            toast.danger("Gagal mencetak draft Surat Laporan Hasil Rekon", {
                description: getErrorMessage(error),
            });
        },
    });

    const handleDownloadAction = useCallback(
        (key: Key) => {
            const template = TEMPLATE_REKON.find((t) => t.id === key);
            if (template) {
                window.open(template.href, "_blank", "noopener,noreferrer");
                return;
            }
            if (key === ACTION_SURAT_LHR) draftSuratMutation.mutate();
        },
        [draftSuratMutation],
    );

    const berkasRow = berkasTarget ? query.data?.find((r) => r.id === berkasTarget.id) : undefined;

    const f = useRekonFilters({ tahun: 2026, bulan: 10, rekonType: RekonType.ASET_TETAP }, Object.values(RekonType));
    const options = useMemo(() => getPerangkatDaerahOptions(query.data ?? []), [query.data]);
    const rows = useMemo(() => filterRekonRows(query.data ?? [], { q: f.q, pd: f.pd }), [query.data, f.q, f.pd]);

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
                <div className="ml-auto flex items-center gap-2">
                    <Dropdown>
                        <Button variant="secondary" isPending={draftSuratMutation.isPending}>
                            <Download size={16} />
                            Unduh
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu onAction={handleDownloadAction}>
                                {TEMPLATE_REKON.map((t) => (
                                    <Dropdown.Item key={t.id} id={t.id} textValue={`Template ${t.label}`}>
                                        <FileSpreadsheet size={16} />
                                        <Label>Template {t.label}</Label>
                                    </Dropdown.Item>
                                ))}
                                <Dropdown.Item id={ACTION_SURAT_LHR} textValue="Draft Surat Laporan Hasil Rekon">
                                    <FileText size={16} />
                                    <Label>Draft Surat Laporan Hasil Rekon</Label>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
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

            <RekonFilterBar
                query={f.q} onQueryChange={f.setQuery}
                perangkatDaerahId={f.pd} onPerangkatDaerahChange={f.setPerangkatDaerah}
                options={options} hasActiveFilter={f.hasActiveFilter} onReset={f.resetFilters}
            />

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
                        <RekonTable data={rows} resetPageKey={`${f.rekonType}|${f.q}|${f.pd}`} onEdit={setEditTarget} onOpenBerkas={openBerkas} />
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