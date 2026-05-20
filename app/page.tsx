"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, Tabs } from "@heroui/react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  X,
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardList,
  PackageSearch,
  ArrowRight,
  Info,
  LucideIcon,
  Watch,
  Icon,
  ArrowRightLeft,
  ClipboardCheck,
  MapPin,
} from "lucide-react";

// ─── Banner version — ubah string ini setiap deploy agar banner muncul kembali
const BANNER_VERSION = "v1.0.0";
const BANNER_KEY = `bmd_banner_dismissed_${BANNER_VERSION}`;

// ─── Sub-tool navigation ──────────────────────────────────────────────────────

const SUB_TOOLS: {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  available: boolean;
}[] = [
    {
      href: "/rkbmd",
      label: "Dashboard RKBMD",
      desc: "Penyusunan Rencana Kebutuhan Barang Milik Daerah berdasarkan data hasil import",
      icon: <LayoutDashboard size={18} />,
      available: true,
    },
    {
      href: "#pengalihan",
      label: "Pengalihan Status Penggunaan",
      desc: "Pengelolaan proses alih status penggunaan BMD antar pengguna barang",
      icon: <ArrowRightLeft size={18} />,
      available: false,
    },
    {
      href: "#penetapan",
      label: "Penetapan Status Penggunaan",
      desc: "Administrasi dan penetapan status penggunaan Barang Milik Daerah",
      icon: <ClipboardCheck size={18} />,
      available: false,
    },
    {
      href: "sebaran",
      label: "Sebaran BMD",
      desc: "Visualisasi dan pemetaan sebaran aset/barang milik daerah per lokasi",
      icon: <MapPin size={18} />,
      available: false,
    },
  ];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BarangItem {
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
}

export interface BarangMerged {
  nomor: number;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
}

export type AsetType =
  | "tanah"
  | "peralatan_mesin"
  | "bangunan"
  | "jalan_irigasi_jaringan"
  | "aset_tetap_lainnya";

type ExcelSource = File | ArrayBuffer | ArrayBufferView;

// ─── Kolom (0-indexed) ────────────────────────────────────────────────────────

const COL_BASE = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, H: 7, I: 8 } as const;

const ASET_COL_MAP: Record<AsetType, { jumlah: number; satuan: number; namaBarang: number }> = {
  tanah: { namaBarang: 8, jumlah: 16, satuan: 17 },
  peralatan_mesin: { namaBarang: 8, jumlah: 19, satuan: 20 },
  bangunan: { namaBarang: 9, jumlah: 19, satuan: 20 },
  jalan_irigasi_jaringan: { namaBarang: 9, jumlah: 20, satuan: 21 },
  aset_tetap_lainnya: { namaBarang: 8, jumlah: 17, satuan: 18 },
};

const START_ROW_INDEX = 13;
const STORAGE_KEY = (asetType: AsetType) => `bmd_merged_${asetType}`;

// ─── Tab config ───────────────────────────────────────────────────────────────

import {
  LandPlot,
  Settings,
  Building2,
  Route,
  Package,
} from "lucide-react";

const TABS: {
  key: AsetType;
  label: string;
  icon: LucideIcon;
  desc: string;
}[] = [
    {
      key: "tanah",
      label: "Tanah",
      icon: LandPlot,
      desc: "Lahan, kavling, tanah kosong",
    },
    {
      key: "peralatan_mesin",
      label: "Peralatan & Mesin",
      icon: Settings,
      desc: "Kendaraan, komputer, alat berat",
    },
    {
      key: "bangunan",
      label: "Bangunan",
      icon: Building2,
      desc: "Gedung, kantor, gudang",
    },
    {
      key: "jalan_irigasi_jaringan",
      label: "Jalan, Irigasi & Jaringan",
      icon: Route,
      desc: "Jalan, saluran, jaringan listrik/air",
    },
    {
      key: "aset_tetap_lainnya",
      label: "Aset Tetap Lainnya",
      icon: Package,
      desc: "Aset yang tidak termasuk kategori lain",
    },
  ];

// ─── extractBarang ────────────────────────────────────────────────────────────

export async function extractBarang(source: ExcelSource, asetType: AsetType): Promise<BarangItem[]> {
  const { namaBarang: colNamaBarang, jumlah: colJumlah, satuan: colSatuan } = ASET_COL_MAP[asetType];
  const workbook = await readWorkbook(source);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null });

  const result: BarangItem[] = [];

  for (let rowIdx = START_ROW_INDEX; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const h = toStr(row[COL_BASE.H]);
    if (!h) continue;

    const namaBarang = toStr(row[colNamaBarang]);
    if (!namaBarang) continue;

    const segments = [
      row[COL_BASE.A], row[COL_BASE.B], row[COL_BASE.C],
      row[COL_BASE.D], row[COL_BASE.E], row[COL_BASE.F],
    ].map(toStr).filter(Boolean) as string[];
    segments.push(h);

    const jumlah = asetType === "tanah" ? 1 : toNum(row[colJumlah]);
    const satuan = toStr(row[colSatuan]);

    result.push({ kodeBarang: segments.join("."), namaBarang, jumlah, satuan });
  }

  return result;
}

export function mergeBarang(items: BarangItem[]): BarangMerged[] {
  const map = new Map<string, BarangMerged>();
  for (const item of items) {
    const existing = map.get(item.kodeBarang);
    if (existing) {
      existing.jumlah += item.jumlah;
    } else {
      map.set(item.kodeBarang, { nomor: 0, kodeBarang: item.kodeBarang, namaBarang: item.namaBarang, jumlah: item.jumlah, satuan: item.satuan });
    }
  }
  return [...map.values()].sort((a, b) => a.kodeBarang.localeCompare(b.kodeBarang)).map((item, idx) => ({ ...item, nomor: idx + 1 }));
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFromStorage(asetType: AsetType): BarangMerged[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(asetType));
    return raw ? (JSON.parse(raw) as BarangMerged[]) : [];
  } catch { return []; }
}

function saveToStorage(asetType: AsetType, data: BarangMerged[]): void {
  try { localStorage.setItem(STORAGE_KEY(asetType), JSON.stringify(data)); } catch { }
}

function clearStorage(asetType: AsetType): void {
  try { localStorage.removeItem(STORAGE_KEY(asetType)); } catch { }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStr(value: unknown): string {
  return value != null ? String(value).trim() : "";
}
function toNum(value: unknown): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}
async function readWorkbook(source: ExcelSource): Promise<XLSX.WorkBook> {
  if (source instanceof File) return XLSX.read(await source.arrayBuffer(), { type: "array" });
  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) return XLSX.read(source, { type: "array" });
  throw new Error("Unsupported source type.");
}

// ─── BannerInfo ───────────────────────────────────────────────────────────────
// Banner muncul kembali setiap kali BANNER_VERSION berubah (setiap rebuild/deploy)

function BannerInfo() {
  const [dismissed, setDismissed] = useState(true); // default true → hindari flash

  useEffect(() => {
    const val = localStorage.getItem(BANNER_KEY);
    if (val !== "1") setDismissed(false);
  }, []);

  function dismiss() {
    localStorage.setItem(BANNER_KEY, "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 mb-5 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-default-400 hover:text-default-700 transition-colors"
        aria-label="Tutup"
      >
        <X size={16} />
      </button>
      <div className="flex gap-3 items-start pr-6">
        <Info size={20} className="text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-primary-800 text-sm mb-1">
            Selamat datang di Tool Pengelolaan BMD
          </p>
          <p className="text-xs text-primary-700 leading-relaxed mb-3">
            Alat ini dirancang untuk membantu <strong>Pengelola BMD</strong> dan <strong>Pengurus Barang</strong> dalam
            mengelola, merekapitulasi, dan menyiapkan data Barang Milik Daerah dari EBMD — tanpa perlu input manual satu per satu.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {[
              { step: "1", title: "Pilih Kategori", body: "Pilih kategori aset sesuai jenis Barang Milik Daerah" },
              { step: "2", title: "Upload File Excel", body: "Unggah file laporan BMD (.xlsx/.xls)" },
              { step: "3", title: "Gunakan Hasil Rekap", body: "Data otomatis direkap — kode barang yang sama digabung jumlahnya." },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-white rounded-lg p-3 border border-primary-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-primary text-xs flex items-center justify-center font-bold shrink-0">{step}</span>
                  <span className="font-semibold text-xs text-default-800">{title}</span>
                </div>
                <p className="text-xs text-default-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-primary-600">
            💡 <strong>Tips:</strong> Seluruh data diproses secara lokal di browser dan tidak dikirim ke server
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SubToolNav ───────────────────────────────────────────────────────────────

function SubToolNav() {
  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-default-400 uppercase tracking-wide mb-2">Sub-tool tersedia</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SUB_TOOLS.map(({ href, label, desc, icon, available }) => (
          available ? (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-1.5 rounded-xl border border-default-200 bg-white hover:border-primary hover:shadow-sm p-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-primary">{icon}</span>
                <ArrowRight size={13} className="text-default-300 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs font-semibold text-default-800 leading-tight">{label}</p>
              <p className="text-xs text-default-400 leading-tight">{desc}</p>
            </Link>
          ) : (
            <div
              key={href}
              className="flex flex-col gap-1.5 rounded-xl border border-dashed border-default-200 bg-default-50 p-3 opacity-60 cursor-not-allowed"
              title="Segera hadir"
            >
              <div className="flex items-center justify-between">
                <span className="text-default-400">{icon}</span>
                <span className="text-[10px] text-default-400 font-medium bg-default-100 px-1.5 py-0.5 rounded">Soon</span>
              </div>
              <p className="text-xs font-semibold text-default-600 leading-tight">{label}</p>
              <p className="text-xs text-default-400 leading-tight">{desc}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ─── UploadZone ───────────────────────────────────────────────────────────────

interface UploadZoneProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  fileName: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  asetType: AsetType;
}

function UploadZone({ inputRef, loading, fileName, onChange, asetType }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const tab = TABS.find(t => t.key === asetType)!;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    // Simulate file input change
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={[
        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all select-none",
        dragOver
          ? "border-primary bg-primary-50 scale-[1.01]"
          : "border-default-200 hover:border-primary-300 hover:bg-default-50",
        loading ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onChange}
      />
      <div className="text-4xl">
        {loading ? (
          <Watch />
        ) : (
          <tab.icon className="w-10 h-10 text-primary" />
        )}
      </div>
      {loading ? (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-default-700">Sedang memproses file...</p>
          <p className="text-xs text-default-400">Mohon tunggu, data sedang dibaca dan direkap</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-default-700">✅ File berhasil diproses</p>
          <p className="text-xs text-default-400 font-mono">{fileName}</p>
          <p className="text-xs text-primary mt-1">Klik atau seret file lain untuk mengganti</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-medium text-default-700">
            Seret file Excel ke sini, atau <span className="text-primary underline">klik untuk memilih</span>
          </p>
          <p className="text-xs text-default-400">Format yang didukung: .xlsx, .xls (laporan BMD {tab.label})</p>
          <p className="text-xs text-default-400 mt-1">{tab.desc}</p>
        </div>
      )}
    </div>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ merged }: { merged: BarangMerged[] }) {
  const totalJumlah = merged.reduce((s, i) => s + i.jumlah, 0);
  const satuanSet = new Set(merged.map(i => i.satuan).filter(Boolean));

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Kode Barang Unik", value: merged.length, color: "text-primary" },
        { label: "Total Jumlah", value: totalJumlah.toLocaleString("id-ID"), color: "text-success" },
        { label: "Jenis Satuan", value: satuanSet.size, color: "text-warning" },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-lg border border-default-200 bg-default-50 px-4 py-3 text-center">
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-default-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── AsetTabContent ───────────────────────────────────────────────────────────

function AsetTabContent({ asetType }: { asetType: AsetType }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [merged, setMerged] = useState<BarangMerged[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = loadFromStorage(asetType);
    setMerged(saved);
  }, [asetType]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setLoading(true);
    try {
      const extracted = await extractBarang(file, asetType);
      const result = mergeBarang(extracted);
      setMerged(result);
      saveToStorage(asetType, result);
      setSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleReset() {
    setMerged([]);
    setFileName(null);
    setError(null);
    setSearch("");
    clearStorage(asetType);
  }

  const hasData = merged.length > 0;
  const filtered = search.trim()
    ? merged.filter(
      (item) =>
        item.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
        item.kodeBarang.includes(search)
    )
    : merged;

  return (
    <div className="flex flex-col gap-4">
      {!hasData ? (
        <UploadZone
          inputRef={inputRef}
          loading={loading}
          fileName={fileName}
          onChange={handleFileChange}
          asetType={asetType}
        />
      ) : (
        <>
          {/* Stats */}
          <StatsBar merged={merged} />

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Cari nama barang atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-default-200 bg-default-50 focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
            <Button size="sm" onPress={() => inputRef.current?.click()} isDisabled={loading}>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              Ganti File
            </Button>
            <Button variant="danger-soft" size="sm" onPress={handleReset}>
              Reset
            </Button>
          </div>

          {search && (
            <p className="text-xs text-default-400">
              Menampilkan {filtered.length} dari {merged.length} kode barang
            </p>
          )}
        </>
      )}

      {error && (
        <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 flex gap-2 items-start">
          <span className="text-danger mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-medium text-danger">Gagal membaca file</p>
            <p className="text-xs text-danger-600 mt-0.5">{error}</p>
            <p className="text-xs text-default-500 mt-1">
              Pastikan file yang diunggah adalah laporan BMD dengan format yang benar (bukan file lain).
            </p>
          </div>
        </div>
      )}

      {/* Tabel */}
      {hasData && (
        <div className="max-h-[460px] overflow-y-auto rounded-lg border border-default-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-default-100 z-10">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-default-600 text-xs w-10">No</th>
                <th className="text-left py-2 px-3 font-medium text-default-600 text-xs">Kode Barang</th>
                <th className="text-left py-2 px-3 font-medium text-default-600 text-xs">Nama Barang</th>
                <th className="text-right py-2 px-3 font-medium text-default-600 text-xs w-20">Jumlah</th>
                <th className="text-left py-2 px-3 font-medium text-default-600 text-xs w-20">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-default-400">
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.kodeBarang} className="border-t border-default-100 hover:bg-default-50">
                    <td className="py-2 px-3 text-default-400 text-xs">{item.nomor}</td>
                    <td className="py-2 px-3 font-mono text-xs text-default-600">{item.kodeBarang}</td>
                    <td className="py-2 px-3 text-default-800">{item.namaBarang}</td>
                    <td className="py-2 px-3 text-right font-semibold">{item.jumlah.toLocaleString("id-ID")}</td>
                    <td className="py-2 px-3 text-default-500 text-xs">{item.satuan || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  // Track which tabs have data for badge indicator
  const [tabData, setTabData] = useState<Record<AsetType, number>>({
    tanah: 0,
    peralatan_mesin: 0,
    bangunan: 0,
    jalan_irigasi_jaringan: 0,
    aset_tetap_lainnya: 0,
  });

  useEffect(() => {
    const counts = {} as Record<AsetType, number>;
    for (const tab of TABS) {
      const saved = loadFromStorage(tab.key);
      counts[tab.key] = saved.length;
    }
    setTabData(counts);
  }, []);

  const totalImported = Object.values(tabData).reduce((s, v) => s + v, 0);

  return (
    <div className="flex flex-col items-center p-6 min-h-screen bg-default-50">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Tool Pengelolaan BMD
            </h1>
            <p className="text-sm text-default-500 mt-1">
              Membantu Pengelola Barang dan Pengurus Barang dalam administrasi BMD
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalImported > 0 && (
              <span className="text-xs bg-success-100 text-success-700 border border-success-200 px-2 py-1 rounded-full font-medium">
                {totalImported} kode terimport
              </span>
            )}
          </div>
        </div>

        {/* Banner onboarding */}
        <BannerInfo />

        {/* Sub-tool navigation */}
        <SubToolNav />

        {/* Main card */}
        <Card className="w-full shadow-sm">
          <Card.Content className="p-0">
            <Tabs className="w-full">
              <Tabs.ListContainer className="border-b border-default-200 px-4 pt-4">
                <Tabs.List aria-label="Kategori Aset">
                  {TABS.map(({ key, label, icon: Icon }) => (
                    <Tabs.Tab key={key} id={key} className="gap-1.5">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                      {tabData[key] > 0 && (
                        <span className="ml-1 text-xs bg-success text-white rounded-full px-1.5 py-0.5 font-medium leading-none">
                          {tabData[key]}
                        </span>
                      )}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>

              {TABS.map(({ key, label, desc }) => (
                <Tabs.Panel key={key} id={key} className="p-5">
                  {/* Tab sub-header */}
                  <div className="mb-4 pb-3 border-b border-default-100">
                    <p className="text-xs text-default-400 font-medium uppercase tracking-wide">Kategori Aset</p>
                    <p className="text-base font-semibold text-default-800 mt-0.5">{label}</p>
                    <p className="text-xs text-default-500">{desc}</p>
                  </div>
                  <AsetTabContent asetType={key} />
                </Tabs.Panel>
              ))}
            </Tabs>
          </Card.Content>
        </Card>

        {/* Footer note */}
        <p className="text-xs text-default-400 text-center mt-4">
          Data tersimpan di browser (localStorage) · Tidak dikirim ke server · Aman untuk digunakan secara offline
        </p>
      </div>
    </div>
  );
}