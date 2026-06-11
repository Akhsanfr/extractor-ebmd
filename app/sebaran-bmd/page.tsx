"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Button,
    Card,
    Chip,
    Input,
    Label,
    ListBox,
    Pagination,
    ProgressBar,
    Select,
    Separator,
    Spinner,
    Table,
    TextField,
    toast,
} from "@heroui/react";
import { Download, Eye, Upload } from "lucide-react";
import {
    exportKmlAction,
    getDistinctPicAction,
    getStatistikAction,
    getStatistikPerPicAction,
    actionSebaranBmdGetAll,
} from "@/action/sebaranBmd/sebaranBmd.action";
import type {
    BmdTanahStatDTO,
    BmdTanahStatPerPicDTO,
    StatusPolygonFilter,
    StatusPlottingFilter,
    SebaranBMDContract,
} from "@/action/sebaranBmd/sebaranBmd.contract";
import { UploadPolygonModal } from "./modal";
import { UploadExcelModal } from "./modalExcel";
import { StatusBhumi } from "@/enum/sebaranBmd";

const PAGE_SIZE = 20;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <Card>
            <Card.Header className="pb-1">
                <Card.Description className="text-xs text-default-500 uppercase tracking-wide text-left w-full">
                    {label}
                </Card.Description>
            </Card.Header>
            <Card.Content className="pt-0">
                <p className="text-2xl font-bold">
                    {typeof value === "number" ? value.toLocaleString("id-ID") : value}
                </p>
                {sub && <p className="text-xs text-default-400 mt-0.5">{sub}</p>}
            </Card.Content>
        </Card>
    );
}

const copasScriptBhumi = async () => {
    try {
        const scriptBhumi = await fetch("/sebaran-bmd/script-bhumi.js")
            .then(res => res.text());
        await navigator.clipboard.writeText(scriptBhumi);
        toast.success("Berhasil menyalin script Bhumi. Silakan buka app Bhumi ATR/BPN, tempel pada console")
    } catch (error) {
        toast.danger("Gagal menyalin script Bhumi")
    }
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BmdTanahPage() {
    // ── State Autentikasi PIC ─────────────────────────────────────────────────
    const [namaPic, setNamaPic] = useState<string>("");
    const [inputLoginPic, setInputLoginPic] = useState<string>("");
    const [inputPassword, setInputPassword] = useState<string>("");

    // ── State ─────────────────────────────────────────────────────────────────
    const [stat, setStat] = useState<BmdTanahStatDTO | null>(null);
    const [statPerPic, setStatPerPic] = useState<BmdTanahStatPerPicDTO[]>([]);
    const [picOptions, setPicOptions] = useState<string[]>([]);

    const [rows, setRows] = useState<SebaranBMDContract.SelectDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [filterPic, setFilterPic] = useState("");
    const [filterStatus, setFilterStatus] = useState<StatusPolygonFilter>("semua");
    const [filterStatusBhumi, setStatusBhumi] = useState<StatusBhumi | "all">("all");
    const [search, setSearch] = useState("");
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [activeBmd, setActiveBmd] = useState<SebaranBMDContract.SelectDTO | null>(null);
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [kmlLoading, setKmlLoading] = useState(false);

    // ── Fetch helpers ─────────────────────────────────────────────────────────

    const fetchStat = useCallback(async () => {
        const [s, sp, pics] = await Promise.all([
            getStatistikAction(),
            getStatistikPerPicAction(),
            getDistinctPicAction(),
        ]);
        setStat(s);
        setStatPerPic([...sp].sort((a, b) => b.sudahPlotting - a.sudahPlotting));
        setPicOptions(pics);
    }, []);

    const fetchList = useCallback(
        async (pg: number) => {
            setLoading(true);
            try {
                const result = await actionSebaranBmdGetAll({ page: pg, limit: PAGE_SIZE, filter: { pic: filterPic, statusBhumi: filterStatusBhumi } })
                console.log(result)
                if (!result.success) throw result.error
                setTotal(result.data.total);
                setRows(result.data.data)
            } catch (e: any) {
                toast.danger(e.message)
            }
            finally {
                setLoading(false);
            }
        },
        [filterPic, filterStatus, filterStatusBhumi, search]
    );

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchStat();
    }, [fetchStat]);

    useEffect(() => {
        setPage(1);
        fetchList(1);
    }, [filterPic, filterStatus, search, fetchList]);

    useEffect(() => {
        fetchList(page);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ──────────────────────────────────────────────────────────────

    function handleLoginPic() {
        if (!inputLoginPic) {
            toast.danger("Silakan pilih nama PIC terlebih dahulu.");
            return;
        }
        if (inputPassword !== "pbmd") {
            toast.danger("Password salah!");
            return;
        }
        setNamaPic(inputLoginPic);
        toast.success(`Berhasil masuk sebagai ${inputLoginPic}`);
    }

    function handleSearchChange(val: string) {
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => setSearch(val), 400);
    }

    async function handleExportKml() {
        setKmlLoading(true);
        try {
            const { kmlString, filename } = await exportKmlAction();
            const blob = new Blob([kmlString], { type: "application/vnd.google-earth.kml+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`File ${filename} berhasil diunduh.`);
        } catch {
            toast.danger("Gagal mengekspor KML.");
        } finally {
            setKmlLoading(false);
        }
    }

    function handleUploadSuccess() {
        fetchStat();
        fetchList(page);
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);

    // ── Pagination Helper ─────────────────────────────────────────────────────

    const getPageNumbers = (): (number | "ellipsis")[] => {
        const siblingCount = 1;
        const totalPageNumbers = siblingCount + 5;

        if (totalPages <= totalPageNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(page - siblingCount, 1);
        const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, "ellipsis", totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [firstPageIndex, "ellipsis", ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [firstPageIndex, "ellipsis", ...middleRange, "ellipsis", lastPageIndex];
        }

        return [];
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Modal Verifikasi PIC ── */}
            {!namaPic && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <Card className="w-full max-w-sm">
                        <Card.Header className="pb-2 flex flex-col items-start">
                            <h2 className="text-xl font-bold">Verifikasi PIC</h2>
                            <p className="text-sm text-default-500">Silakan pilih nama Anda dan masukkan password untuk mengakses data.</p>
                        </Card.Header>
                        <Card.Content className="flex flex-col gap-4">
                            <Select
                                selectionMode="single"
                                value={inputLoginPic}
                                onChange={(value) => setInputLoginPic(String(value))}
                            >
                                <Label>Nama PIC</Label>
                                <Select.Trigger>
                                    <Select.Value />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {picOptions.map((p) => (
                                            <ListBox.Item id={p} key={p} textValue={p}>
                                                <Label>{p}</Label>
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>

                            <TextField onChange={(val) => setInputPassword(val)}>
                                <Label>Password</Label>
                                <Input type="password" placeholder="Masukkan password" />
                            </TextField>

                            <Button onPress={handleLoginPic} className="mt-2">
                                Masuk
                            </Button>
                        </Card.Content>
                    </Card>
                </div>
            )}

            <div className={`flex flex-col gap-6 p-6 ${!namaPic ? "pointer-events-none blur-sm" : ""}`}>
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Digitasi Tanah BMD</h1>
                        <p className="text-sm text-default-500">
                            Manajemen polygon bidang tanah Barang Milik Daerah
                            {namaPic && (
                                <span className="font-semibold text-primary ml-1">
                                    (Login sebagai: {namaPic})
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onPress={() => setExcelModalOpen(true)}>
                            <Upload size={16} />
                            Import Excel
                        </Button>
                        <Button onPress={handleExportKml} isPending={kmlLoading}>
                            <Download size={16} />
                            Export KML
                        </Button>
                    </div>
                </div>

                {/* ── Statistik ── */}
                {stat ? (
                    <>
                        {/* 5 Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatCard label="Total BMD" value={stat.total} />
                            <StatCard
                                label="Sudah Diproses"
                                value={stat.sudahDiproses}
                                sub={`${stat.belumDiproses.toLocaleString("id-ID")} belum`}
                            />
                            <StatCard
                                label="Sudah Digitasi"
                                value={stat.sudahDigitasi}
                                sub={`${stat.belumDigitasi.toLocaleString("id-ID")} belum`}
                            />
                            <StatCard
                                label="% Proses"
                                value={`${stat.progressProsesPct}%`}
                            />
                            <StatCard
                                label="% Digitasi"
                                value={`${stat.progressDigitasiPct}%`}
                            />
                        </div>

                        {/* 2 Progress Bars */}
                        <div className="flex flex-col gap-3">
                            <ProgressBar value={stat.progressProsesPct} className="max-w-full">
                                <div className="flex justify-between mb-1">
                                    <Label>Progress Proses (Status Plotting)</Label>
                                    <ProgressBar.Output />
                                </div>
                                <ProgressBar.Track>
                                    <ProgressBar.Fill />
                                </ProgressBar.Track>
                            </ProgressBar>

                            <ProgressBar value={stat.progressDigitasiPct} color="success" className="max-w-full">
                                <div className="flex justify-between mb-1">
                                    <Label>Progress Digitasi (Polygon)</Label>
                                    <ProgressBar.Output />
                                </div>
                                <ProgressBar.Track>
                                    <ProgressBar.Fill />
                                </ProgressBar.Track>
                            </ProgressBar>
                        </div>

                        {/* Stat per PIC */}
                        {statPerPic.length > 0 && (
                            <Card>
                                <Card.Header>
                                    <Card.Title className="text-sm font-semibold">Statistik per PIC</Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-default-500 border-b">
                                                    <th className="py-2 pr-4 font-medium">PIC</th>
                                                    <th className="py-2 pr-4 font-medium text-right">Total</th>
                                                    <th className="py-2 pr-4 font-medium text-center">Sudah Plotting</th>
                                                    <th className="py-2 pr-4 font-medium text-center">Belum Plotting</th>
                                                    <th className="py-2 pr-4 font-medium text-center">Sudah Digitasi</th>
                                                    <th className="py-2 font-medium text-center">Belum Digitasi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statPerPic.map((r) => (
                                                    <tr key={r.pic} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium">{r.pic}</td>
                                                        <td className="py-2 pr-4 text-right">
                                                            {r.total.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="py-2 pr-4 text-center">
                                                            <Chip color="success" size="sm">{r.sudahPlotting}</Chip>
                                                        </td>
                                                        <td className="py-2 pr-4 text-center">
                                                            <Chip color="warning" size="sm">{r.belumPlotting}</Chip>
                                                        </td>
                                                        <td className="py-2 pr-4 text-center">
                                                            <Chip color="success" size="sm">{r.sudahDigitasi}</Chip>
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            <Chip color="warning" size="sm">{r.belumDigitasi}</Chip>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Content>
                            </Card>
                        )}
                    </>
                ) : (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                )}

                <Separator />

                {/* ── Filter ── */}
                <div className="flex gap-2 items-end">
                    {/* Filter PIC */}
                    <Select
                        className="w-56"
                        selectionMode="single"
                        value={filterPic}
                        onChange={(value) => {
                            setFilterPic(value === "all" || value === null ? "" : String(value));
                        }}
                    >
                        <Label>Filter PIC</Label>
                        <Select.Trigger>
                            <Select.Value />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="all" textValue="Semua PIC">
                                    <Label>Semua PIC</Label>
                                </ListBox.Item>
                                {picOptions.map((p) => (
                                    <ListBox.Item id={p} key={p} textValue={p}>
                                        <Label>{p}</Label>
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    {/* Filter Status Polygon */}
                    <Select
                        selectionMode="single"
                        value={filterStatus}
                        onChange={(value) => setFilterStatus(value as StatusPolygonFilter)}
                    >
                        <Label>Status Polygon</Label>
                        <Select.Trigger>
                            <Select.Value />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="semua" key="semua" textValue="Semua">
                                    <Label>Semua</Label>
                                </ListBox.Item>
                                <ListBox.Item id="sudah" key="sudah" textValue="Sudah Digitasi">
                                    <Label>Sudah Digitasi</Label>
                                </ListBox.Item>
                                <ListBox.Item id="belum" key="belum" textValue="Belum Digitasi">
                                    <Label>Belum Digitasi</Label>
                                </ListBox.Item>
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    {/* Filter Status Plotting */}
                    <Select
                        selectionMode="single"
                        value={filterStatusBhumi}
                        onChange={(value) => setStatusBhumi(value as StatusBhumi)}
                    >
                        <Label>Status Plotting</Label>
                        <Select.Trigger>
                            <Select.Value />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <>
                                    <ListBox.Item id="all" key="all" textValue="Semua">
                                        <Label>Semua</Label>
                                    </ListBox.Item>
                                    <ListBox.Item id="belum set" key="belum set" textValue="Semua">
                                        <Label>Belum Set</Label>
                                    </ListBox.Item>

                                    {Object.entries(StatusBhumi).map(([key, value]) => (
                                        <ListBox.Item id={value} key={key} textValue={value}>
                                            <Label>{value}</Label>
                                        </ListBox.Item>
                                    ))}
                                </>
                            </ListBox>
                        </Select.Popover>
                    </Select>
                    <Button onPress={copasScriptBhumi}>Script Bhumi</Button>

                    {/* Search */}
                    {/* <TextField className="w-72" onChange={handleSearchChange}>
                        <Label>Cari NIBAR / Nomor / Desa</Label>
                        <Input />
                    </TextField> */}
                </div>

                {/* ── Table ── */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-default-500">
                        {loading
                            ? "Memuat..."
                            : `Menampilkan ${from}–${to} dari ${total.toLocaleString("id-ID")} data`}
                    </p>

                    <Table>
                        <Table.ScrollContainer>
                            <Table.Content aria-label="Daftar BMD Tanah">
                                <Table.Header>
                                    <Table.Column isRowHeader>NIBAR</Table.Column>
                                    <Table.Column>Hak</Table.Column>
                                    <Table.Column>Nomor</Table.Column>
                                    <Table.Column>Desa</Table.Column>
                                    <Table.Column>PIC</Table.Column>
                                    <Table.Column>Status Polygon</Table.Column>
                                    <Table.Column>Status Plotting</Table.Column>
                                    <Table.Column>Aksi</Table.Column>
                                </Table.Header>

                                <Table.Body>
                                    {rows.map((row) => (
                                        <Table.Row
                                            key={row.nibar}
                                            id={row.nibar}
                                        >
                                            <Table.Cell>{row.nibar}</Table.Cell>
                                            <Table.Cell>{row.hak ?? "-"}</Table.Cell>
                                            <Table.Cell>{row.nomor ?? "-"}</Table.Cell>
                                            <Table.Cell>{row.desa ?? "-"}</Table.Cell>
                                            <Table.Cell>{row.pic ?? "-"}</Table.Cell>

                                            <Table.Cell>
                                                {row.polygon ? (
                                                    <Chip color="success" size="sm">
                                                        Sudah Digitasi
                                                    </Chip>
                                                ) : (
                                                    <Chip size="sm">
                                                        Belum Digitasi
                                                    </Chip>
                                                )}
                                            </Table.Cell>

                                            <Table.Cell>
                                                <Chip>
                                                    {row.statusBhumi}
                                                </Chip>
                                            </Table.Cell>

                                            <Table.Cell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onPress={() => setActiveBmd(row)}
                                                    >
                                                        <Eye /> Aksi
                                                    </Button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Content>
                        </Table.ScrollContainer>
                    </Table>

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-2">
                            <Pagination color="primary">
                                <Pagination.Content>
                                    <Pagination.Item>
                                        <Pagination.Previous
                                            isDisabled={page === 1}
                                            onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                                        >
                                            <Pagination.PreviousIcon />
                                        </Pagination.Previous>
                                    </Pagination.Item>

                                    {getPageNumbers().map((p, i) =>
                                        p === "ellipsis" ? (
                                            <Pagination.Item key={`ellipsis-${i}`}>
                                                <Pagination.Ellipsis />
                                            </Pagination.Item>
                                        ) : (
                                            <Pagination.Item key={p}>
                                                <Pagination.Link
                                                    isActive={p === page}
                                                    onPress={() => setPage(p)}
                                                >
                                                    {p}
                                                </Pagination.Link>
                                            </Pagination.Item>
                                        )
                                    )}

                                    <Pagination.Item>
                                        <Pagination.Next
                                            isDisabled={page === totalPages}
                                            onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                        >
                                            <Pagination.NextIcon />
                                        </Pagination.Next>
                                    </Pagination.Item>
                                </Pagination.Content>
                            </Pagination>
                        </div>
                    )}
                </div>

                {/* ── Modals ── */}
                {activeBmd && (
                    <UploadPolygonModal
                        bmd={activeBmd}
                        isOpen={!!activeBmd}
                        namaPic={namaPic}
                        onClose={() => setActiveBmd(null)}
                        onSuccess={handleUploadSuccess}
                    />
                )}

                <UploadExcelModal
                    isOpen={excelModalOpen}
                    onClose={() => setExcelModalOpen(false)}
                    onSuccess={handleUploadSuccess}
                />
            </div>
        </>
    );
}