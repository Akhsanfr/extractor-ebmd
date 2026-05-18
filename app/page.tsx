"use client";

import { useState, useRef } from "react";
import { Button, Card } from "@heroui/react";
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

type ExcelSource = File | ArrayBuffer | ArrayBufferView;

// ─── Kolom (0-indexed) ────────────────────────────────────────────────────────
// A=0  B=1  C=2  D=3  E=4  F=5  G=6  H=7  I=8
// T=19 (jumlah)  U=20 (satuan)

const COL = {
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5,
  H: 7, I: 8,
  T: 19, U: 20,
} as const;

const START_ROW_INDEX = 13; // baris ke-14 (0-indexed)

// ─── extractBarang ────────────────────────────────────────────────────────────

/**
 * Membaca file Excel BMD dan mengekstrak data barang mulai baris ke-14.
 * Hanya baris yang kolom H (nomor urut) berisi nilai yang diambil.
 *
 * Kolom yang diambil:
 *  A,B,C,D,E,F → segmen kode barang
 *  H           → nomor urut item
 *  I           → nama barang
 *  T           → jumlah
 *  U           → satuan
 */
export async function extractBarang(source: ExcelSource): Promise<BarangItem[]> {
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
    const h = toStr(row[COL.H]);
    if (!h) continue;

    const namaBarang = toStr(row[COL.I]);
    if (!namaBarang) continue;

    const segments = [row[COL.A], row[COL.B], row[COL.C], row[COL.D], row[COL.E], row[COL.F]]
      .map(toStr)
      .filter(Boolean) as string[];

    segments.push(h);

    result.push({
      kodeBarang: segments.join("."),
      namaBarang,
      jumlah: toNum(row[COL.T]),
      satuan: toStr(row[COL.U]),
    });
  }

  return result;
}

// ─── mergeBarang ──────────────────────────────────────────────────────────────

/**
 * Menggabungkan item dengan kode barang yang sama.
 * Jumlah dijumlahkan, satuan diambil dari item pertama yang ditemukan.
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
        nomor: 0, // diisi setelah sort
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
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
      const extracted = await extractBarang(file);
      setMerged(mergeBarang(extracted));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file.");
    } finally {
      setLoading(false);
    }
  }

  const hasData = merged.length > 0;

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Card className="w-[800px]">
        <Card.Header>
          <Card.Title>Import Data BMD</Card.Title>
          <Card.Description>
            Upload file Excel laporan BMD untuk mengekstrak data barang.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-3">
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
        </Card.Content>
      </Card>

      {hasData && (
        <Card className="w-[800px]">
          <Card.Header>
            <Card.Title>Data Barang</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-default-100">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">No</th>
                    <th className="text-left py-2 px-3 font-medium">Kode Barang</th>
                    <th className="text-left py-2 px-3 font-medium">Nama Barang</th>
                    <th className="text-right py-2 px-3 font-medium">Jumlah</th>
                    <th className="text-left py-2 px-3 font-medium">Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map((item) => (
                    <tr key={item.kodeBarang} className="border-t border-default-100">
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
          </Card.Content>
        </Card>
      )}
    </div>
  );
}