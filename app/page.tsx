"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, Tabs } from "@heroui/react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

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
// A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7 I=8
// Q=16 R=17 S=18 T=19 U=20 V=21

const COL_BASE = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, H: 7, I: 8 } as const;

/**
 * Mapping kolom jumlah & satuan per tipe aset:
 *
 * | Tipe Aset                    | Jumlah | Satuan |
 * |------------------------------|--------|--------|
 * | TANAH                        | Q (16) | R (17) |
 * | PERALATAN & MESIN            | T (19) | U (20) |
 * | GEDUNG & BANGUNAN            | T (19) | U (20) |
 * | JALAN, IRIGASI & JARINGAN    | U (20) | V (21) |
 * | ASET TETAP LAINNYA           | R (17) | S (18) |
 */
const ASET_COL_MAP: Record<AsetType, { jumlah: number; satuan: number; namaBarang: number }> = {
  tanah: { namaBarang: 8, jumlah: 16, satuan: 17 },  // kolom I
  peralatan_mesin: { namaBarang: 8, jumlah: 19, satuan: 20 },  // kolom I
  bangunan: { namaBarang: 9, jumlah: 19, satuan: 20 },  // kolom J
  jalan_irigasi_jaringan: { namaBarang: 9, jumlah: 20, satuan: 21 },  // kolom J
  aset_tetap_lainnya: { namaBarang: 8, jumlah: 17, satuan: 18 },  // kolom I
};

const START_ROW_INDEX = 13; // baris ke-14 (0-indexed)

const STORAGE_KEY = (asetType: AsetType) => `bmd_merged_${asetType}`;

// ─── extractBarang ────────────────────────────────────────────────────────────

export async function extractBarang(
  source: ExcelSource,
  asetType: AsetType
): Promise<BarangItem[]> {
  const { namaBarang: colNamaBarang, jumlah: colJumlah, satuan: colSatuan } = ASET_COL_MAP[asetType];

  console.info(
    `[extractBarang] asetType="${asetType}" → kolom jumlah=idx(${colJumlah}), satuan=idx(${colSatuan})`
  );

  const workbook = await readWorkbook(source);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  console.info(`[extractBarang] total baris: ${rows.length}, parsing mulai baris ${START_ROW_INDEX + 1}`);

  // Log judul file (baris 1-6) untuk konfirmasi tipe aset yang diupload
  const judul = rows.slice(0, 6)
    .map((r) => toStr((r as unknown[])[0]))
    .filter(Boolean);
  console.info("[extractBarang] judul file:", judul);

  // Log nilai header pada kolom jumlah & satuan (baris ke-11, index 10)
  const headerRow = (rows[10] ?? []) as unknown[];
  console.table({
    [`col idx ${colNamaBarang} (namaBarang)`]: toStr(headerRow[colNamaBarang]) || "(kosong)",
    [`col idx ${colJumlah} (jumlah)`]: toStr(headerRow[colJumlah]) || "(kosong)",
    [`col idx ${colSatuan} (satuan)`]: toStr(headerRow[colSatuan]) || "(kosong)",
  });

  const result: BarangItem[] = [];
  let skippedNoH = 0;
  let skippedNoNama = 0;

  for (let rowIdx = START_ROW_INDEX; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];

    const h = toStr(row[COL_BASE.H]);
    if (!h) { skippedNoH++; continue; }

    const namaBarang = toStr(row[colNamaBarang]); // ← perubahan utama
    if (!namaBarang) {
      skippedNoNama++;
      console.warn(
        `[extractBarang] baris ${rowIdx + 1}: H="${h}" ada tapi kolom idx(${colNamaBarang}) (namaBarang) kosong — dilewati`
      );
      continue;
    }

    const segments = [
      row[COL_BASE.A], row[COL_BASE.B], row[COL_BASE.C],
      row[COL_BASE.D], row[COL_BASE.E], row[COL_BASE.F],
    ]
      .map(toStr)
      .filter(Boolean) as string[];

    segments.push(h);

    let jumlah = 0;
    if (asetType === "tanah") {
      // Untuk tanah, setiap baris yang valid dihitung sebagai 1 unit
      jumlah = 1;
    } else {
      // Untuk tipe lain, tetap ambil dari kolom excel yang ditentukan
      jumlah = toNum(row[colJumlah]);
    }
    const satuan = toStr(row[colSatuan]);

    if (jumlah === 0) {
      console.warn(
        `[extractBarang] baris ${rowIdx + 1}: jumlah=0 pada "${namaBarang}" ` +
        `(col idx ${colJumlah}, nilai mentah="${toStr(row[colJumlah])}")`
      );
    }
    if (!satuan) {
      console.warn(
        `[extractBarang] baris ${rowIdx + 1}: satuan kosong pada "${namaBarang}" ` +
        `(col idx ${colSatuan}, nilai mentah="${toStr(row[colSatuan])}")`
      );
    }

    result.push({
      kodeBarang: segments.join("."),
      namaBarang,
      jumlah,
      satuan,
    });
  }

  if (result.length === 0) {
    console.error(
      `[extractBarang] TIDAK ADA DATA untuk asetType="${asetType}". ` +
      `Kemungkinan: kolom H (idx ${COL_BASE.H}) tidak berisi nomor urut di file ini, ` +
      `atau START_ROW_INDEX (${START_ROW_INDEX}) tidak sesuai struktur file.`
    );
  } else {
    console.info(
      `[extractBarang] ✓ selesai: ${result.length} item, ` +
      `skip H-kosong=${skippedNoH}, skip nama-kosong=${skippedNoNama}`
    );
    console.debug("[extractBarang] sample 3 item pertama:", result.slice(0, 3));
  }

  return result;
}

// ─── mergeBarang ──────────────────────────────────────────────────────────────

export function mergeBarang(items: BarangItem[]): BarangMerged[] {
  console.info(`[mergeBarang] input: ${items.length} item mentah`);

  const map = new Map<string, BarangMerged>();

  for (const item of items) {
    const existing = map.get(item.kodeBarang);
    if (existing) {
      console.debug(
        `[mergeBarang] duplikat kodeBarang="${item.kodeBarang}" — jumlah ${existing.jumlah} + ${item.jumlah}`
      );
      existing.jumlah += item.jumlah;
    } else {
      map.set(item.kodeBarang, {
        nomor: 0,
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        jumlah: item.jumlah,
        satuan: item.satuan,
      });
    }
  }

  const result = [...map.values()]
    .sort((a, b) => a.kodeBarang.localeCompare(b.kodeBarang))
    .map((item, idx) => ({ ...item, nomor: idx + 1 }));

  console.info(
    `[mergeBarang] ✓ ${items.length} item → ${result.length} kode unik ` +
    `(${items.length - result.length} duplikat digabung)`
  );

  return result;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFromStorage(asetType: AsetType): BarangMerged[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(asetType));
    return raw ? (JSON.parse(raw) as BarangMerged[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(asetType: AsetType, data: BarangMerged[]): void {
  try {
    localStorage.setItem(STORAGE_KEY(asetType), JSON.stringify(data));
  } catch {
    // storage penuh atau private mode — abaikan
  }
}

function clearStorage(asetType: AsetType): void {
  try {
    localStorage.removeItem(STORAGE_KEY(asetType));
  } catch {
    // abaikan
  }
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
  if (source instanceof File) {
    return XLSX.read(await source.arrayBuffer(), { type: "array" });
  }
  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
    return XLSX.read(source, { type: "array" });
  }
  throw new Error("Unsupported source type.");
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { key: AsetType; label: string }[] = [
  { key: "tanah", label: "Tanah" },
  { key: "peralatan_mesin", label: "Peralatan dan Mesin" },
  { key: "bangunan", label: "Bangunan" },
  { key: "jalan_irigasi_jaringan", label: "Jalan, Irigasi, dan Jaringan" },
  { key: "aset_tetap_lainnya", label: "Aset Tetap Lainnya" },
];

// ─── AsetTabContent ───────────────────────────────────────────────────────────

interface AsetTabContentProps {
  asetType: AsetType;
}

function AsetTabContent({ asetType }: AsetTabContentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [merged, setMerged] = useState<BarangMerged[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate dari localStorage saat mount
  useEffect(() => {
    const saved = loadFromStorage(asetType);
    if (saved.length > 0) {
      console.info(`[AsetTabContent] hydrate dari localStorage: asetType="${asetType}", ${saved.length} item`);
    } else {
      console.debug(`[AsetTabContent] localStorage kosong untuk asetType="${asetType}"`);
    }
    setMerged(saved);
  }, [asetType]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.info(`[handleFileChange] file dipilih: "${file.name}" (${(file.size / 1024).toFixed(1)} KB), asetType="${asetType}"`);

    setFileName(file.name);
    setError(null);
    setLoading(true);

    try {
      const extracted = await extractBarang(file, asetType);
      const result = mergeBarang(extracted);
      setMerged(result);
      saveToStorage(asetType, result);
      console.info(`[handleFileChange] ✓ disimpan ke localStorage: key="${"bmd_merged_" + asetType}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membaca file.";
      console.error(`[handleFileChange] error:`, err);
      setError(msg);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleReset() {
    console.warn(`[handleReset] data dihapus untuk asetType="${asetType}"`);
    setMerged([]);
    setFileName(null);
    setError(null);
    clearStorage(asetType);
  }

  const hasData = merged.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onPress={() => inputRef.current?.click()}
            isDisabled={loading}
          >
            {loading ? "Memproses..." : "Pilih File Excel"}
          </Button>
          {fileName && (
            <span className="text-sm text-default-500 truncate max-w-[300px]">
              {fileName}
            </span>
          )}
        </div>

        {hasData && (
          <Button
            variant="danger-soft"
            size="sm"
            onPress={handleReset}
          >
            Reset Data
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {hasData && (
        <p className="text-sm text-success">
          {merged.length} kode barang unik.
        </p>
      )}

      {/* Tabel hasil */}
      {hasData && (
        <div className="max-h-[500px] overflow-y-auto rounded-lg border border-default-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-default-100">
              <tr>
                <th className="text-left py-2 px-3 font-medium w-10">No</th>
                <th className="text-left py-2 px-3 font-medium">Kode Barang</th>
                <th className="text-left py-2 px-3 font-medium">Nama Barang</th>
                <th className="text-right py-2 px-3 font-medium w-20">Jumlah</th>
                <th className="text-left py-2 px-3 font-medium w-20">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((item) => (
                <tr
                  key={item.kodeBarang}
                  className="border-t border-default-100 hover:bg-default-50"
                >
                  <td className="py-2 px-3 text-default-400 text-xs">{item.nomor}</td>
                  <td className="py-2 px-3 font-mono text-xs text-default-600">{item.kodeBarang}</td>
                  <td className="py-2 px-3">{item.namaBarang}</td>
                  <td className="py-2 px-3 text-right font-medium">{item.jumlah}</td>
                  <td className="py-2 px-3 text-default-500">{item.satuan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!hasData && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-default-400">
          <p className="text-sm">Belum ada data. Pilih file Excel untuk memulai.</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<AsetType>("tanah");
  const router = useRouter();
  return (
    <div className="flex flex-col items-center p-6">
      <Card className="w-[900px]">
        <Card.Header>
          <Card.Title>Import Data BMD</Card.Title>
          <Card.Description>
            Upload file Excel laporan BMD per kategori aset tetap.
          </Card.Description>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/create")}>
              Menu Data Pemeliharaan
            </Button>
          </div>
        </Card.Header>

        <Card.Content className="flex flex-col gap-0">
          {/* Custom tab list */}
          <div className="flex border-b border-default-200 mb-4 gap-1">
            {TABS.map(({ key, label }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={[
                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground border-b-2 border-primary shadow-sm"
                      : "text-default-500 hover:text-default-800 hover:bg-default-100",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab panels — semua di-mount agar state tidak hilang saat ganti tab */}
          {TABS.map(({ key }) => (
            <div key={key} className={activeTab === key ? "block" : "hidden"}>
              <AsetTabContent asetType={key} />
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  );
}