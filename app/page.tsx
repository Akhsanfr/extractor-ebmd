"use client";

import { useState, useRef } from "react";
import { Button, Card } from "@heroui/react";
import * as XLSX from "xlsx";

export interface BarangItem {
  kodeBarang: string;
  namaBarang: string;
}

type ExcelSource = File | ArrayBuffer | ArrayBufferView;

export async function extractBarang(source: ExcelSource): Promise<BarangItem[]> {
  const workbook = await readWorkbook(source);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const START_ROW_INDEX = 13;
  const result: BarangItem[] = [];

  for (let rowIdx = START_ROW_INDEX; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];

    const namaBarang = toStr(row[8]);
    if (!namaBarang) continue;

    const segments = [row[0], row[1], row[2], row[3], row[4], row[5]]
      .map(toStr)
      .filter(Boolean) as string[];

    const h = toStr(row[7]);
    if (h) segments.push(h);

    result.push({ kodeBarang: segments.join("."), namaBarang });
  }

  return result;
}

function toStr(value: unknown): string {
  return value != null ? String(value).trim() : "";
}

async function readWorkbook(source: ExcelSource): Promise<XLSX.WorkBook> {
  if (source instanceof File) {
    return XLSX.read(await source.arrayBuffer(), { type: "array" });
  }

  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
    return XLSX.read(source, { type: "array" });
  }

  throw new Error(
    "Unsupported source type. Expected: File | ArrayBuffer | ArrayBufferView"
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [items, setItems] = useState<BarangItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setItems([]);
    setLoading(true);

    try {
      const result = await extractBarang(file);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Card className="w-[600px]">
        <Card.Header>
          <Card.Title>Import Data BMD</Card.Title>
          <Card.Description>
            Upload file Excel laporan BMD untuk mengekstrak data barang.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Trigger button */}
          <div className="flex items-center gap-3">
            <Button onPress={() => inputRef.current?.click()} isDisabled={loading}>
              {loading ? "Memproses..." : "Pilih File Excel"}
            </Button>
            {fileName && (
              <span className="text-sm text-default-500 truncate max-w-[300px]">
                {fileName}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          {/* Result summary */}
          {items.length > 0 && (
            <p className="text-sm text-success">
              {items.length} barang berhasil diekstrak.
            </p>
          )}
        </Card.Content>
      </Card>

      {/* Result table */}
      {items.length > 0 && (
        <Card className="w-[600px]">
          <Card.Header>
            <Card.Title>Hasil Ekstraksi</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-default-100">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Kode Barang</th>
                    <th className="text-left py-2 px-3 font-medium">Nama Barang</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t border-default-100">
                      <td className="py-2 px-3 font-mono text-xs text-default-600">
                        {item.kodeBarang}
                      </td>
                      <td className="py-2 px-3">{item.namaBarang}</td>
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