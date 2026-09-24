"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Download, Eye, Upload, Search } from "lucide-react";
import {
    useTable,
    flexRender,
    createColumnHelper,
    type PaginationState,
    tableFeatures,
    createPaginatedRowModel,
    rowPaginationFeature,
} from "@tanstack/react-table";

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

const features = tableFeatures({ rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() })
const columnHelper = createColumnHelper<typeof features, SebaranBMDContract.SelectDTO>();

const copasScriptBhumi = async () => {
    try {
        const scriptBhumi = await fetch("/sebaran-bmd/script-bhumi.js").then(res => res.text());
        await navigator.clipboard.writeText(scriptBhumi);
        toast.success("Berhasil menyalin script Bhumi. Silakan buka app Bhumi ATR/BPN, tempel pada console");
    } catch (error) {
        toast.danger("Gagal menyalin script Bhumi");
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BmdTanahPage() {
    // ── State Autentikasi PIC ─────────────────────────────────────────────────
    const [namaPic, setNamaPic] = useState<string>("");
    const [inputLoginPic, setInputLoginPic] = useState<string>("");
    const [inputPassword, setInputPassword] = useState<string>("");

    // ── State Data & Filter ───────────────────────────────────────────────────
    const [stat, setStat] = useState<BmdTanahStatDTO | null>(null);
    const [statPerPic, setStatPerPic] = useState<BmdTanahStatPerPicDTO[]>([]);
    const [picOptions, setPicOptions] = useState<string[]>([]);
    const [rows, setRows] = useState<SebaranBMDContract.SelectDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [filterNibar, setFilterNibar] = useState("");
    const [nibarInput, setNibarInput] = useState("");
    const [filterPic, setFilterPic] = useState("");
    const [filterStatus, setFilterStatus] = useState<StatusPolygonFilter>("semua");
    const [filterStatusBhumi, setStatusBhumi] = useState<StatusBhumi | "all">("all");

    // Modal States
    const [activeBmd, setActiveBmd] = useState<SebaranBMDContract.SelectDTO | null>(null);
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [kmlLoading, setKmlLoading] = useState(false);

    // ── TanStack Table Pagination State ───────────────────────────────────────
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0, // TanStack table is 0-indexed
        pageSize: PAGE_SIZE,
    });

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

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const result = await actionSebaranBmdGetAll({
                page: pagination.pageIndex + 1, // API expects 1-indexed 
                limit: pagination.pageSize,
                filter: {
                    pic: filterPic,
                    statusBhumi: filterStatusBhumi,
                    nibar: filterNibar || undefined
                }
            });
            if (!result.success) throw result.error;
            setTotal(result.data.total);
            setRows(result.data.data);
        } catch (e: any) {
            toast.danger(e.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.pageIndex, pagination.pageSize, filterPic, filterStatus, filterStatusBhumi, filterNibar]);

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchStat();
    }, [fetchStat]);

    // Fetch data whenever filters or pagination changes
    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // Reset ke halaman pertama jika filter berubah
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [filterPic, filterStatus, filterStatusBhumi, filterNibar]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const nibarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    function handleNibarChange(val: string) {
        setNibarInput(val);
        if (nibarRef.current) clearTimeout(nibarRef.current);
        nibarRef.current = setTimeout(() => setFilterNibar(val), 500);
    }

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
        fetchList();
    }

    const columns = useMemo(() => columnHelper.columns([
        columnHelper.accessor("nibar", {
            header: "NIBAR",
            cell: info => info.getValue(),
        }),

        columnHelper.accessor("hak", {
            header: "Hak",
            cell: info => info.getValue() ?? "-",
        }),
        columnHelper.accessor("nomor", {
            header: "Nomor",
            cell: info => info.getValue() ?? "-",
        }),
        columnHelper.accessor("desa", {
            header: "Desa",
            cell: info => info.getValue() ?? "-",
        }),
        columnHelper.accessor("pic", {
            header: "PIC",
            cell: info => info.getValue() ?? "-",
        }),
        columnHelper.accessor("polygon", {
            header: "Status Polygon",
            cell: info => info.getValue() ? (
                <Chip color="success" size="sm">Sudah Digitasi</Chip>
            ) : (
                <Chip size="sm">Belum Digitasi</Chip>
            ),
        }),
        columnHelper.accessor("statusBhumi", {
            header: "Status Plotting",
            cell: info => <Chip>{info.getValue()}</Chip>,
        }),
        columnHelper.display({
            id: "aksi",
            header: "Aksi",
            cell: info => (
                <Button size="sm" variant="outline" onPress={() => setActiveBmd(info.row.original)}>
                    <Eye size={14} className="mr-1" /> Aksi
                </Button>
            ),
        }),
    ]), []);

    const table = useTable({
        data: rows,
        columns,
        features,
        manualPagination: true,
        pageCount: Math.ceil(total / pagination.pageSize),
        state: { pagination },
        onPaginationChange: setPagination,
    });

    const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, total);

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
                            <Select selectionMode="single" value={inputLoginPic} onChange={(value) => setInputLoginPic(String(value))}>
                                <Label>Nama PIC</Label>
                                <Select.Trigger><Select.Value /></Select.Trigger>
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

                            <Button onPress={handleLoginPic} className="mt-2">Masuk</Button>
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
                            <Upload size={16} /> Import Excel
                        </Button>
                        <Button onPress={handleExportKml} isPending={kmlLoading}>
                            <Download size={16} /> Export KML
                        </Button>
                    </div>
                </div>

                {/* ── Statistik ── */}
                {stat ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatCard label="Total BMD" value={stat.total} />
                            <StatCard label="Sudah Diproses" value={stat.sudahDiproses} sub={`${stat.belumDiproses.toLocaleString("id-ID")} belum`} />
                            <StatCard label="Sudah Digitasi" value={stat.sudahDigitasi} sub={`${stat.belumDigitasi.toLocaleString("id-ID")} belum`} />
                            <StatCard label="% Proses" value={`${stat.progressProsesPct}%`} />
                            <StatCard label="% Digitasi" value={`${stat.progressDigitasiPct}%`} />
                        </div>
                        <div className="flex flex-col gap-3">
                            <ProgressBar value={stat.progressProsesPct} className="max-w-full">
                                <div className="flex justify-between mb-1">
                                    <Label>Progress Proses (Status Plotting)</Label>
                                    <ProgressBar.Output />
                                </div>
                                <ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track>
                            </ProgressBar>
                            <ProgressBar value={stat.progressDigitasiPct} color="success" className="max-w-full">
                                <div className="flex justify-between mb-1">
                                    <Label>Progress Digitasi (Polygon)</Label>
                                    <ProgressBar.Output />
                                </div>
                                <ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track>
                            </ProgressBar>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center py-8"><Spinner /></div>
                )}

                <Separator />

                {/* ── Filter & Search Controls ── */}
                <div className="flex flex-wrap gap-4 items-end">
                    <Select className="w-56" selectionMode="single" value={filterPic} onChange={(value) => setFilterPic(value === "all" || value === null ? "" : String(value))}>
                        <Label>Filter PIC</Label>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="all" textValue="Semua PIC"><Label>Semua PIC</Label></ListBox.Item>
                                {picOptions.map((p) => (
                                    <ListBox.Item id={p} key={p} textValue={p}><Label>{p}</Label></ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    <Select selectionMode="single" value={filterStatus} onChange={(value) => setFilterStatus(value as StatusPolygonFilter)}>
                        <Label>Status Polygon</Label>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="semua" key="semua" textValue="Semua"><Label>Semua</Label></ListBox.Item>
                                <ListBox.Item id="sudah" key="sudah" textValue="Sudah Digitasi"><Label>Sudah Digitasi</Label></ListBox.Item>
                                <ListBox.Item id="belum" key="belum" textValue="Belum Digitasi"><Label>Belum Digitasi</Label></ListBox.Item>
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    <Select selectionMode="single" value={filterStatusBhumi} onChange={(value) => setStatusBhumi(value as StatusBhumi)}>
                        <Label>Status Plotting</Label>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="all" key="all" textValue="Semua"><Label>Semua</Label></ListBox.Item>
                                <ListBox.Item id="belum set" key="belum set" textValue="Belum Set"><Label>Belum Set</Label></ListBox.Item>
                                {Object.entries(StatusBhumi).map(([key, value]) => (
                                    <ListBox.Item id={value} key={key} textValue={value}><Label>{value}</Label></ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    <TextField className="w-64" value={nibarInput} onChange={handleNibarChange}>
                        <Label>Pencarian NIBAR</Label>
                        <Input placeholder="Ketik NIBAR..." />
                    </TextField>

                    <Button onPress={copasScriptBhumi}>Script Bhumi</Button>
                </div>

                {/* ── Table TanStack ── */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-default-500">
                        {loading
                            ? "Memuat data..."
                            : `Menampilkan ${from}–${to} dari ${total.toLocaleString("id-ID")} data`}
                    </p>

                    <Table>
                        <Table.ScrollContainer>
                            <Table.Content aria-label="Daftar BMD Tanah">
                                <Table.Header>
                                    {table.getFlatHeaders().map((header) => (
                                        <Table.Column key={header.id}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </Table.Column>
                                    ))}
                                </Table.Header>
                                <Table.Body>
                                    {table.getRowModel().rows.length === 0 ? (
                                        <Table.Row>
                                            <Table.Cell className="text-center py-8">
                                                {loading ? <Spinner size="sm" /> : "Data tidak ditemukan"}
                                            </Table.Cell>
                                        </Table.Row>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <Table.Row key={row.id}>
                                                {row.getAllCells().map((cell) => (
                                                    <Table.Cell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </Table.Cell>
                                                ))}
                                            </Table.Row>
                                        ))
                                    )}
                                </Table.Body>
                            </Table.Content>
                        </Table.ScrollContainer>
                    </Table>

                    {/* ── Pagination TanStack ── */}
                    {/* {table.getPageCount() > 1 && (
                        <div className="flex justify-center mt-2">
                            <Pagination
                                total={table.getPageCount()}
                                page={table.getState().pagination.pageIndex + 1}
                                onChange={(page) => table.setPageIndex(page - 1)}
                                color="primary"
                                showControls
                            />
                        </div>
                    )} */}
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