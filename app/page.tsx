"use client";

import { useState, useRef } from "react";
import { Button, Card, Tabs } from "@heroui/react";
import * as XLSX from "xlsx";

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
const ASET_COL_MAP: Record<AsetType, { jumlah: number; satuan: number }> = {
  tanah: { jumlah: 16, satuan: 17 },
  peralatan_mesin: { jumlah: 19, satuan: 20 },
  bangunan: { jumlah: 19, satuan: 20 },
  jalan_irigasi_jaringan: { jumlah: 20, satuan: 21 },
  aset_tetap_lainnya: { jumlah: 17, satuan: 18 },
};

const START_ROW_INDEX = 13; // baris ke-14 (0-indexed)

// ─── extractBarang ────────────────────────────────────────────────────────────

/**
 * Membaca file Excel BMD dan mengekstrak data barang mulai baris ke-14.
 * Hanya baris yang kolom H (nomor urut) berisi nilai yang diambil.
 * Kolom jumlah & satuan disesuaikan per tipe aset via ASET_COL_MAP.
 */
export async function extractBarang(
  source: ExcelSource,
  asetType: AsetType
): Promise<BarangItem[]> {
  const { jumlah: colJumlah, satuan: colSatuan } = ASET_COL_MAP[asetType];

  const workbook = await readWorkbook(source);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const result: BarangItem[] = [];

  for (let rowIdx = START_ROW_INDEX; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];

    // Skip baris header grup (kolom H kosong)
    const h = toStr(row[COL_BASE.H]);
    if (!h) continue;

    const namaBarang = toStr(row[COL_BASE.I]);
    if (!namaBarang) continue;

    const segments = [
      row[COL_BASE.A], row[COL_BASE.B], row[COL_BASE.C],
      row[COL_BASE.D], row[COL_BASE.E], row[COL_BASE.F],
    ]
      .map(toStr)
      .filter(Boolean) as string[];

    segments.push(h);

    result.push({
      kodeBarang: segments.join("."),
      namaBarang,
      jumlah: toNum(row[colJumlah]),
      satuan: toStr(row[colSatuan]),
    });
  }

  return result;
}

// ─── mergeBarang ──────────────────────────────────────────────────────────────

/**
 * Menggabungkan item dengan kode barang yang sama.
 * Jumlah dijumlahkan, satuan & namaBarang diambil dari item pertama.
 * Hasil diurutkan berdasarkan kodeBarang dan diberi nomor urut.
 */
export function mergeBarang(items: BarangItem[]): BarangMerged[] {
  const map = new Map<string, BarangMerged>();

  for (const item of items) {
    const existing = map.get(item.kodeBarang);
    if (existing) {
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

  return [...map.values()]
    .sort((a, b) => a.kodeBarang.localeCompare(b.kodeBarang))
    .map((item, idx) => ({ ...item, nomor: idx + 1 }));
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
  throw new Error("Unsupported source type. Expected: File | ArrayBuffer | ArrayBufferView");
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { key: AsetType; label: string }[] = [
  { key: "tanah", label: "Tanah" },
  { key: "peralatan_mesin", label: "Peralatan dan Mesin" },
  { key: "bangunan", label: "Bangunan" },
  { key: "jalan_irigasi_jaringan", label: "Jalan, Irigasi, dan Jaringan" },
  { key: "aset_tetap_lainnya", label: "Aset Tetap Lainnya" },
];

// ─── TabPanel ─────────────────────────────────────────────────────────────────

interface AsetTabContentProps {
  asetType: AsetType;
}

function AsetTabContent({ asetType }: AsetTabContentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [merged, setMerged] = useState<BarangMerged[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setMerged([]);
    setLoading(true);

    try {
      const extracted = await extractBarang(file, asetType);
      setMerged(mergeBarang(extracted));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file.");
    } finally {
      setLoading(false);
      // reset input agar file yang sama bisa dipilih ulang
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const hasData = merged.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Upload area */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button onPress={() => inputRef.current?.click()} isDisabled={loading}>
          {loading ? "Memproses..." : "Pilih File Excel"}
        </Button>
        {fileName && (
          <span className="text-sm text-default-500 truncate max-w-[400px]">
            {fileName}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {hasData && (
        <p className="text-sm text-success">
          {merged.length} kode barang unik berhasil diekstrak.
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
                <tr key={item.kodeBarang} className="border-t border-default-100 hover:bg-default-50">
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
  return (
    <div className="flex flex-col items-center p-6">
      <Card className="w-[900px]">
        <Card.Header>
          <Card.Title>Import Data BMD</Card.Title>
          <Card.Description>
            Upload file Excel laporan BMD per kategori aset tetap.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <Tabs>
            <Tabs.List aria-label="Kategori Aset Tetap">
              {TABS.map(({ key, label }) => (
                <Tabs.Tab key={key} id={key}>{label}</Tabs.Tab>
              ))}
            </Tabs.List>
            {TABS.map(({ key }) => (
              <Tabs.Panel key={key} id={key}>
                <div className="pt-4">
                  <AsetTabContent asetType={key} />
                </div>
              </Tabs.Panel>
            ))}
          </Tabs>
        </Card.Content>
      </Card>
    </div>
  );
}