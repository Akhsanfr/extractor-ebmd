"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useOverlayState,
} from "@heroui/react"; // Sesuaikan jika menggunakan NextUI
import { loadStorage, PENGADAAN_STORAGE_KEY, PEMELIHARAAN_STORAGE_KEY } from "@/lib/bmd-storage";
import { exportRkbmdToExcel } from "@/lib/exportExcel";
import { importRkbmdFromExcel } from "@/lib/importExcel"; // Pastikan path benar
import type { BarangAll } from "@/types/bmd";
import { ListPengadaan, ListPemeliharaan } from "@/types/rkbmd";
import { convertPengadaanV1toV2 } from "./pengadaan/util";
import { convertPemeliharaanV1toV2 } from "./pemeliharaan/util";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadData<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

// Helper untuk menyimpan kembali ke localStorage
function saveStorage(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
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
    const [pemeliharaan, setPemeliharaan] = useState<any[]>([]); // Boleh cast as FormPemeliharaan[]
    const [pengadaan, setListPengadaan] = useState<ListPengadaan[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Modal state untuk Import
    const state = useOverlayState();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        try {
            // Load Pengadaan
            const pengadaanV2 = loadStorage<ListPengadaan[]>(PENGADAAN_STORAGE_KEY);
            if (pengadaanV2 === null) {
                setListPengadaan(convertPengadaanV1toV2());
            } else {
                setListPengadaan(pengadaanV2);
            }

            // Load Pemeliharaan
            const pemeliharaanV2 = loadStorage<ListPemeliharaan[]>(PEMELIHARAAN_STORAGE_KEY);
            if (!pemeliharaanV2 || pemeliharaanV2.length === 0) {
                setPemeliharaan(convertPemeliharaanV1toV2());
            } else {
                setPemeliharaan(pemeliharaanV2);
            }
        } catch (error) {
            console.error("Gagal membaca dari localStorage:", error);
        } finally {
            setMounted(true);
        }
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

    // Fungsi untuk mem-verifikasi dan menggabungkan data
    const handleImportSubmit = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        try {
            const { pengadaanData: importedPengadaan, pemeliharaanData: importedPemeliharaan } = await importRkbmdFromExcel(selectedFile);

            console.table(importedPemeliharaan)

            // 1. Helper untuk membuat "Unique Key" untuk setiap item
            //    - Pengadaan : path + kodeBarang usulan
            //    - Pemeliharaan : path + kodeBarang BMD + namaPemeliharaan
            //      (satu BMD bisa punya >1 jenis pemeliharaan → harus dianggap item berbeda)
            const generateKey = (item: any, type: 'pengadaan' | 'pemeliharaan') => {
                const path = `${item.penggunaBarang}|${item.kuasaPenggunaBarang}|${item.program}|${item.kegiatan}|${item.output}`;
                if (type === 'pengadaan') {
                    const kode = item.usulan?.kodeBarang ?? '';
                    return `${path}|${kode}`;
                } else {
                    const kode = item.bmd?.kodeBarang ?? item.kodeBarang ?? '';
                    const namaUsul = item.usulanPemeliharaan?.namaPemeliharaan ?? '';
                    return `${path}|${kode}|${namaUsul}`;
                }
            };

            // 2. LOGIKA MERGE PENGADAAN
            // Kita masukkan data existing ke Map agar mudah dicari
            const pengadaanMap = new Map();
            pengadaan.forEach(item => pengadaanMap.set(generateKey(item, 'pengadaan'), item));

            // Update/Tambahkan data dari Excel
            importedPengadaan.forEach(item => {
                pengadaanMap.set(generateKey(item, 'pengadaan'), item); // Key sama akan tertimpa (update), key baru akan ditambah
            });
            const mergedPengadaan = Array.from(pengadaanMap.values());

            // 3. LOGIKA MERGE PEMELIHARAAN
            const pemeliharaanMap = new Map();
            pemeliharaan.forEach(item => {
                const key = generateKey(item, 'pemeliharaan');
                console.log("key generated from localStorage", key)
                pemeliharaanMap.set(key, item);
            });

            importedPemeliharaan.forEach(item => {
                const key = generateKey(item, 'pemeliharaan');
                console.log("key generated from excel", key)
                pemeliharaanMap.set(key, item);
            });
            const mergedPemeliharaan = Array.from(pemeliharaanMap.values());

            // 4. Update State & LocalStorage
            setListPengadaan(mergedPengadaan);
            setPemeliharaan(mergedPemeliharaan);
            saveStorage(PENGADAAN_STORAGE_KEY, mergedPengadaan);
            saveStorage(PEMELIHARAAN_STORAGE_KEY, mergedPemeliharaan);

            alert("Data berhasil disinkronisasi dengan Excel!");
            state.close();
            setSelectedFile(null);
        } catch (e) {
            console.error(e);
            alert("Gagal melakukan import RKBMD.");
        } finally {
            setIsImporting(false);
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
                <div className="flex gap-3">
                    <Button
                        onPress={state.open}
                    >
                        Import RKBMD (.xlsx)
                    </Button>
                    <Button
                        onPress={handleExportAll}
                        isDisabled={totalAnggaran === 0 || isExporting}
                        isPending={isExporting}
                    >
                        Export RKBMD (.xlsx)
                    </Button>
                </div>
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

            {/* Modal Import Excel */}
            <Modal isOpen={state.isOpen} onOpenChange={state.toggle}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            {/* Tombol close (X) opsional di sudut kanan atas */}
                            <Modal.CloseTrigger />

                            <Modal.Header>
                                <Modal.Heading className="text-lg font-semibold">
                                    Import Data RKBMD
                                </Modal.Heading>
                            </Modal.Header>

                            <Modal.Body>
                                <p className="text-sm text-default-500 mb-4">
                                    Pilih file Excel (.xlsx) hasil export sebelumnya. Data yang memiliki kesamaan (Pengguna Barang hingga Kode Barang) akan ditimpa dengan nilai baru dari Excel.
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-default-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                            </Modal.Body>

                            <Modal.Footer>
                                {/* Pastikan Anda memiliki referensi fungsi onClose dari useDisclosure() atau state Anda */}
                                <Button variant="danger-soft" onPress={state.close}>
                                    Batal
                                </Button>
                                <Button
                                    onPress={handleImportSubmit}
                                    isDisabled={!selectedFile || isImporting}
                                    isPending={isImporting}
                                >
                                    Mulai Import
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}