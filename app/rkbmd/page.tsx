"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { loadAllFromStorage } from "@/lib/bmd-storage";
import { exportPemeliharaanToExcel } from "@/lib/exportExcel";
import type { BarangAll } from "@/types/bmd";
import type { FormPemeliharaanData } from "@/app/rkbmd/pemeliharaan/addData";

const PEMELIHARAAN_KEY = "bmd_list_pemeliharaan";
// const PENGADAAN_KEY = "bmd_list_pengadaan"; // siap untuk pengadaan nanti

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadPemeliharaan(): FormPemeliharaanData[] {
    try {
        const raw = localStorage.getItem(PEMELIHARAAN_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    accent = false,
}: {
    label: string;
    value: string | number;
    sub?: string;
    accent?: boolean;
}) {
    return (
        <div
            className={[
                "rounded-2xl border px-6 py-5 flex flex-col gap-1 transition-all",
                accent
                    ? "border-primary/30 bg-primary/5"
                    : "border-default-200 bg-background",
            ].join(" ")}
        >
            <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</p>
            <p className={["text-3xl font-bold", accent ? "text-primary" : "text-foreground"].join(" ")}>
                {value}
            </p>
            {sub && <p className="text-xs text-default-400 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RkbmdDashboardPage() {
    const [barangAll, setBarangAll] = useState<BarangAll[]>([]);
    const [pemeliharaan, setPemeliharaan] = useState<FormPemeliharaanData[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setBarangAll(loadAllFromStorage());
        setPemeliharaan(loadPemeliharaan());
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // ── Stat calculations ──
    const totalBarang = barangAll.length;
    const totalKategori = new Set(barangAll.map((b) => b.asetType)).size;
    const totalPemeliharaan = pemeliharaan.length;
    const totalJumlahPemeliharaan = pemeliharaan.reduce((sum, p) => sum + p.jumlah, 0);

    // Pemeliharaan grouped by asetType
    const pemeliharaanByAset = pemeliharaan.reduce<Record<string, number>>((acc, p) => {
        acc[p.asetType] = (acc[p.asetType] ?? 0) + 1;
        return acc;
    }, {});

    const handleExportPemeliharaan = async () => {
        if (pemeliharaan.length === 0) return;
        setIsExporting(true);
        try {
            await exportPemeliharaanToExcel(pemeliharaan);
        } catch (e) {
            console.error(e);
            alert("Gagal export Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    const ASET_LABEL: Record<string, string> = {
        tanah: "Tanah",
        peralatan_mesin: "Peralatan & Mesin",
        bangunan: "Bangunan",
        jalan_irigasi_jaringan: "Jalan, Irigasi & Jaringan",
        aset_tetap_lainnya: "Aset Tetap Lainnya",
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

            {/* ── Page Header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Dashboard RKBMD
                    </h1>
                    <p className="text-sm text-default-500 mt-1">
                        Ringkasan Rencana Kebutuhan Barang Milik Daerah
                    </p>
                </div>
                <Button
                    onPress={handleExportPemeliharaan}
                    isDisabled={pemeliharaan.length === 0 || isExporting}
                    isPending={isExporting}
                    className="shrink-0"
                >
                    {isExporting ? "Memproses..." : "Export Pemeliharaan"}
                </Button>
            </div>

            {/* ── Stat Grid ── */}
            <section>
                <h2 className="text-xs font-bold text-default-400 uppercase tracking-widest mb-3">
                    Ringkasan Data BMD
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Barang" value={totalBarang} sub={`${totalKategori} kategori`} accent />
                    <StatCard label="Rencana Pemeliharaan" value={totalPemeliharaan} sub="entri tersimpan" />
                    <StatCard label="Total Unit Dipelihara" value={totalJumlahPemeliharaan} />
                    <StatCard label="Pengadaan" value="—" sub="belum ada data" />
                </div>
            </section>

            {/* ── Pemeliharaan per Kategori ── */}
            {totalPemeliharaan > 0 && (
                <section>
                    <h2 className="text-xs font-bold text-default-400 uppercase tracking-widest mb-3">
                        Pemeliharaan per Kategori Aset
                    </h2>
                    <div className="rounded-xl border border-default-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-default-50 border-b border-default-200">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-semibold text-default-600">Kategori Aset</th>
                                    <th className="text-right px-4 py-2.5 font-semibold text-default-600">Jumlah Entri</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default-100">
                                {Object.entries(pemeliharaanByAset).map(([aset, count]) => (
                                    <tr key={aset} className="hover:bg-default-50">
                                        <td className="px-4 py-3 text-foreground">{ASET_LABEL[aset] ?? aset}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-primary">{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ── Quick Nav ── */}
            <section>
                <h2 className="text-xs font-bold text-default-400 uppercase tracking-widest mb-3">
                    Kelola Data
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/rkbmd/pemeliharaan"
                        className="group rounded-2xl border border-default-200 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all p-5 flex items-center justify-between"
                    >
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                Pemeliharaan
                            </p>
                            <p className="text-xs text-default-400 mt-0.5">
                                {totalPemeliharaan} entri · Input &amp; kelola rencana pemeliharaan
                            </p>
                        </div>
                        <svg className="text-default-300 group-hover:text-primary transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>

                    <Link
                        href="/rkbmd/pengadaan"
                        className="group rounded-2xl border border-default-200 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all p-5 flex items-center justify-between"
                    >
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                Pengadaan
                            </p>
                            <p className="text-xs text-default-400 mt-0.5">
                                — · Input &amp; kelola rencana pengadaan
                            </p>
                        </div>
                        <svg className="text-default-300 group-hover:text-primary transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* ── Empty state jika belum ada data ── */}
            {totalBarang === 0 && (
                <div className="text-center py-12 text-default-400 rounded-2xl border border-dashed border-default-200">
                    <p className="text-sm">Belum ada data barang.</p>
                    <Link href="/" className="text-sm text-primary hover:underline mt-1 inline-block">
                        Import data BMD terlebih dahulu →
                    </Link>
                </div>
            )}
        </div>
    );
}
