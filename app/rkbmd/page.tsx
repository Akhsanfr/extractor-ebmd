"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { loadAllFromStorage } from "@/lib/bmd-storage";
import { exportRkbmdToExcel } from "@/lib/exportExcel"; // Fungsi gabungan baru
import type { BarangAll } from "@/types/bmd";
import type { FormPemeliharaanData } from "@/app/rkbmd/pemeliharaan/addData";
import type { FormPengadaanData } from "@/app/rkbmd/pengadaan/addData";

const PEMELIHARAAN_KEY = "bmd_list_pemeliharaan";
const PENGADAAN_KEY = "bmd_list_pengadaan";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadData<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "default" }: {
    label: string,
    value: string | number,
    sub?: string,
    color?: "default" | "primary" | "secondary"
}) {
    const colors = {
        default: "border-default-200 bg-background",
        primary: "border-primary/30 bg-primary/5",
        secondary: "border-secondary/30 bg-secondary/5"
    };
    return (
        <div className={`rounded-2xl border px-6 py-5 flex flex-col gap-1 ${colors[color]}`}>
            <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-default-400">{sub}</p>}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RkbmdDashboardPage() {
    const [barangAll, setBarangAll] = useState<BarangAll[]>([]);
    const [pemeliharaan, setPemeliharaan] = useState<FormPemeliharaanData[]>([]);
    const [pengadaan, setPengadaan] = useState<FormPengadaanData[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setBarangAll(loadAllFromStorage());
        setPemeliharaan(loadData<FormPemeliharaanData>(PEMELIHARAAN_KEY));
        setPengadaan(loadData<FormPengadaanData>(PENGADAAN_KEY));
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const totalPemeliharaan = pemeliharaan.length;
    const totalPengadaan = pengadaan.length;
    const totalAnggaran = pemeliharaan.length + pengadaan.length;

    const handleExportAll = async () => {
        if (totalAnggaran === 0) return;
        setIsExporting(true);
        try {
            await exportRkbmdToExcel(pengadaan, pemeliharaan);
        } catch (e) {
            console.error(e);
            alert("Gagal export RKBMD.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard RKBMD</h1>
                    <p className="text-sm text-default-500">Monitor rencana kebutuhan barang daerah tahun 2027</p>
                </div>
                <Button
                    onPress={handleExportAll}
                    isDisabled={totalAnggaran === 0 || isExporting}
                    isPending={isExporting}
                >
                    Export RKBMD (.xlsx)
                </Button>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Aset Tersedia" value={barangAll.length} sub="Barang Milik Daerah" />
                <StatCard label="Total Usulan RKBMD" value={totalAnggaran} sub="Pengadaan & Pemeliharaan" color="primary" />
                <StatCard label="Rencana Pengadaan" value={totalPengadaan} sub="Item Usulan Baru" color="secondary" />
                <StatCard label="Rencana Pemeliharaan" value={totalPemeliharaan} sub="Item Perbaikan" />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/rkbmd/pengadaan" className="p-6 rounded-2xl border bg-secondary/5 border-secondary/20 hover:border-secondary transition-all">
                    <h3 className="font-bold text-secondary">Manajemen Pengadaan</h3>
                    <p className="text-sm text-default-600 mt-2">Kelola usulan barang baru, hitung kebutuhan riil, dan optimalkan stok aset yang ada.</p>
                </Link>
                <Link href="/rkbmd/pemeliharaan" className="p-6 rounded-2xl border bg-default-100/50 border-default-200 hover:border-primary transition-all">
                    <h3 className="font-bold text-foreground">Manajemen Pemeliharaan</h3>
                    <p className="text-sm text-default-600 mt-2">Kelola rencana perbaikan aset agar usia pakai barang tetap optimal.</p>
                </Link>
            </div>
        </div>
    );
}