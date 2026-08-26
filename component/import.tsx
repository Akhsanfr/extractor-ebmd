"use client";

import { ExcelRow, parseExcelFile } from "@/lib/xlsx/parseXlsx"
import { toast } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { ZodTypeAny, z } from "zod";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";

function groupIssuesByRow(
    issues: { path: PropertyKey[]; message: string }[]
): Map<number, string> {
    const map = new Map<number, string>();
    for (const issue of issues) {
        const rowIndex = typeof issue.path[0] === "number" ? issue.path[0] : null;
        if (rowIndex === null) continue;

        const field = issue.path.slice(1).join(".");
        const msg = field ? `${field}: ${issue.message}` : issue.message;

        const existing = map.get(rowIndex);
        map.set(rowIndex, existing ? `${existing}; ${msg}` : msg);
    }
    return map;
}

function downloadRowsWithErrors(
    // headerRows: ExcelRow[],
    rows: ExcelRow[],
    rowErrors: Map<number, string>,
    fileName: string
) {
    const aoa: (string | number | null)[][] = [
        // ...headerRows,
        ...rows.map((row, idx) => [
            ...row,
            rowErrors.get(idx) ?? "",
        ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");

    XLSX.writeFile(workbook, fileName);
}

interface ImportExcelProps<TSchema extends ZodTypeAny> {
    /** Zod schema untuk seluruh array baris, mis. ApbdAnggaranContract.importItem */
    validation: TSchema;
    /**
     * Dipanggil setelah data lolos validasi, menerima data hasil validation.data
     * (bukan raw Excel). Pemanggilan Server Action / proses selanjutnya jadi
     * tanggung jawab caller di sini.
     */
    onSuccess: (data: z.infer<TSchema>, file: File) => void;
    /**
     * Transform 1 baris hasil parse Excel (key = header asli, mis. "KODE URUSAN")
     * menjadi bentuk yang sesuai field DTO (mis. { kodeUrusan: ... }) sebelum divalidasi.
     * Wajib diisi kalau header Excel tidak sama persis dengan nama field schema.
     * Default: identity (row dipakai apa adanya).
     */
    format: (row: ExcelRow[]) => (Record<string, unknown> & {
        originalIndex: number;
    })[];
    /** Nama sheet diambil*/
    sheetName: string;
    /** Label yang ditampilkan di dropzone */
    label?: string;
}


export default function ImportExcel<TSchema extends ZodTypeAny>({
    validation,
    onSuccess,
    format,
    sheetName,
    label = "Tarik & lepas file Excel di sini, atau klik untuk memilih",
}: ImportExcelProps<TSchema>) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(
        async (file: File) => {
            setIsLoading(true);
            try {

                const allRows = await parseExcelFile(file, sheetName);
                const formatted = format(allRows)
                const result = validation.safeParse(formatted);
                if (!result.success) {
                    const filteredErrors = groupIssuesByRow(result.error.issues);

                    const rowErrors = new Map<number, string>();

                    for (const [filteredIndex, message] of filteredErrors) {
                        const originalIndex =
                            formatted[filteredIndex]?.originalIndex;

                        if (originalIndex !== undefined) {
                            rowErrors.set(originalIndex, message);
                        }
                    }

                    const errorFileName = `${file.name.replace(/\.[^.]+$/, "")}-error.xlsx`;

                    downloadRowsWithErrors(
                        // headerRows,
                        allRows,
                        rowErrors,
                        errorFileName
                    );

                    toast.danger("Validasi gagal", {
                        description: `${rowErrors.size} dari ${formatted.length} baris bermasalah. File dengan kolom Error telah diunduh.`,
                    });

                    return;
                }

                onSuccess(result.data, file);
            } catch (error: any) {
                toast.danger("Gagal import Excel", {
                    description: error?.message ?? "Terjadi kesalahan tak terduga",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [validation, onSuccess]
    );

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (isLoading) return;
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const [justDropped, setJustDropped] = useState(false);

    useEffect(() => {
        if (!justDropped) return;
        const t = setTimeout(() => setJustDropped(false), 900);
        return () => clearTimeout(t);
    }, [justDropped]);

    return (
        <div
            role="button"
            tabIndex={0}
            aria-disabled={isLoading}
            onClick={() => !isLoading && inputRef.current?.click()}
            onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isLoading) {
                    e.preventDefault();
                    inputRef.current?.click();
                }
            }}
            onDragOver={(e) => {
                e.preventDefault();
                if (!isLoading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={[
                "group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl p-8 text-center outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isLoading ? "pointer-events-none opacity-60" : "",
            ].join(" ")}
        >
            {/* layer 1: gradient conic yang diputer pakai animate-spin bawaan tailwind */}
            <span
                aria-hidden
                className={[
                    "absolute inset-0 rounded-xl transition-opacity duration-500",
                    "bg-[conic-gradient(from_0deg,hsl(var(--heroui-primary)),hsl(var(--heroui-default-200)),hsl(var(--heroui-secondary)),hsl(var(--heroui-primary)))]",
                    "animate-spin",
                    isDragging
                        ? "opacity-100 [animation-duration:1.2s]"
                        : "opacity-30 group-hover:opacity-60 [animation-duration:5s]",
                ].join(" ")}
            />

            {/* layer 2: mask 2px di dalamnya jadi keliatan kayak border gradient */}
            <span
                aria-hidden
                className="absolute inset-[2px] rounded-[10px] bg-content1"
            />

            {/* konten */}
            <div className="relative z-10 flex flex-col items-center gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    hidden
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processFile(file);
                        e.target.value = "";
                    }}
                />

                {isLoading ? (
                    <>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <p className="text-sm text-default-500">Memproses...</p>
                    </>
                ) : justDropped ? (
                    <>
                        <CheckCircle2 className="h-7 w-7 animate-bounce text-success" />
                        <p className="text-sm text-default-500">File diterima!</p>
                    </>
                ) : (
                    <>
                        <UploadCloud
                            className={[
                                "h-7 w-7 transition-transform duration-300",
                                isDragging
                                    ? "animate-bounce text-primary"
                                    : "text-default-400 group-hover:-translate-y-0.5 group-hover:text-primary",
                            ].join(" ")}
                        />
                        <p className="text-sm text-default-500">{label}</p>
                    </>
                )}
            </div>
        </div>
    );
}