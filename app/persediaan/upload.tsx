"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import { SuratPesananExtractResult } from "@/action/persediaan/suratPesanan/suratPesanan.contract";
import { extractSuratPesananAction } from "@/action/persediaan/suratPesanan/suratPesanan.action";
import { actionFindMatchKodePersediaan } from "@/action/persediaan/findMatchKodePersediaan/findMatchKodePersediaan.action";
import { FindMatchKodePersediaanContract } from "@/action/persediaan/findMatchKodePersediaan/findMatchKodePersediaan.contract";
// import { matchKodefikasiAction } from "@/action/persediaan/kodePersediaan/kodePersediaan.action";
// import { KodefikasiMatchResult } from "@/action/persediaan/kodePersediaan/kodePersediaan.contract";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Keputusan user untuk tiap baris di Bagian B:
// - pilih salah satu kandidat kodefikasi yang ada, ATAU
// - tandai sebagai barang baru (belum ada kodefikasinya)
type ItemDecision =
    | { type: "existing"; candidateId: number; recordedQty: number }
    | { type: "new" };

type SavedRecapRow = {
    description: string;
    quantity: number;
    unit: string;
    decision: ItemDecision;
    matchedLabel?: string; // nama108 · namaBarang kandidat terpilih, kalau ada
    recordedQty?: number; // jumlah yang benar-benar dicatat (dalam satuan kandidat)
    recordedUnit?: string; // satuan pencatatan (candidate.satuan)
    pricePerRecordedUnit?: number; // harga per satuan pencatatan setelah konversi
};

// ---- Konversi satuan pembelian -> satuan pencatatan ----
// Contoh kasus paling umum: beli per Lusin, dicatat per Buah (1 Lusin = 12 Buah)
const UNIT_TO_BUAH: Record<string, number> = {
    buah: 1,
    pcs: 1,
    piece: 1,
    pieces: 1,
    unit: 1,
    lusin: 12,
    losin: 12,
    lsn: 12,
    kodi: 20,
    gross: 144,
    gros: 144,
    rim: 500,
};

function normalizeUnit(unit: string) {
    return unit.trim().toLowerCase();
}

/**
 * Mengembalikan faktor konversi dari satuan pembelian ke satuan pencatatan.
 * Contoh: fromUnit="Lusin", toUnit="Buah" -> 12 (artinya 1 Lusin = 12 Buah)
 * Return null kalau satuan sama, atau salah satu satuan tidak dikenali
 * (dalam kasus ini dianggap tidak perlu konversi).
 */
function getConversionFactor(fromUnit: string, toUnit: string): number | null {
    const from = UNIT_TO_BUAH[normalizeUnit(fromUnit)];
    const to = UNIT_TO_BUAH[normalizeUnit(toUnit)];
    if (from === undefined || to === undefined) return null;
    if (from === to) return null;
    return from / to;
}

function defaultRecordedQty(
    purchaseQty: number,
    purchaseUnit: string,
    recordUnit: string
) {
    const factor = getConversionFactor(purchaseUnit, recordUnit);
    if (!factor) return purchaseQty;
    return Math.round(purchaseQty * factor);
}

export function SuratPesananUploader() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();
    const [isMatching, startMatching] = useTransition();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<SuratPesananExtractResult | null>(
        null
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Bagian B: rekomendasi kodefikasi per item
    const [matches, setMatches] = useState<FindMatchKodePersediaanContract.OutputDTO | null>(
        null
    );
    const [matchError, setMatchError] = useState<string | null>(null);
    const [decisions, setDecisions] = useState<Record<number, ItemDecision>>(
        {}
    );

    // Simpan (simulasi)
    const [isSaving, setIsSaving] = useState(false);
    const [savedRecap, setSavedRecap] = useState<{
        referenceNumber: string;
        savedAt: Date;
        rows: SavedRecapRow[];
    } | null>(null);

    function handlePickFile() {
        inputRef.current?.click();
    }

    function loadKodefikasiMatches(items: FindMatchKodePersediaanContract.InputDTO) {
        setMatches(null);
        setMatchError(null);
        setDecisions({});
        setSavedRecap(null);

        startMatching(async () => {
            const response = await actionFindMatchKodePersediaan(items);
            console.log(response);
            if (!response.success) {
                console.error(response);
                // setMatchError(response.message ?? "Gagal mencari kodefikasi");
                return;
            }

            setMatches(response.data);
        });
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = ""; // izinkan pilih file yang sama lagi
        if (!file) return;

        setErrorMessage(null);
        setResult(null);
        setMatches(null);
        setMatchError(null);
        setDecisions({});
        setSavedRecap(null);

        if (file.type !== "application/pdf") {
            setErrorMessage("File harus berformat PDF");
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setErrorMessage("Ukuran file maksimal 10MB");
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append("file", file);

        startTransition(async () => {
            const response = await extractSuratPesananAction(formData);
            if (!response.success) {
                console.error(response)
                // setErrorMessage(response.message ?? "Gagal mengekstrak dokumen");
                return;
            }

            setResult(response.data);

            // Lanjut otomatis: cari kodefikasi paling cocok untuk tiap item
            if (response.data.items.length > 0) {
                loadKodefikasiMatches(response.data.items.map(item => ({ namaBarang: item.description, satuan: item.unit, price: item.unit_price, unit: item.unit })));
            }
        });
    }

    function handleSelectCandidate(index: number, candidateId: number) {
        const match = matches?.[index];
        const candidate = match?.candidates.find((c) => c.id === candidateId);
        const resultItem = result?.items[index];
        const purchaseQty = resultItem?.quantity ?? 0;
        const purchaseUnit = match?.unit ?? resultItem?.unit ?? "";

        const recordedQty = candidate
            ? defaultRecordedQty(purchaseQty, purchaseUnit, candidate.satuan)
            : purchaseQty;

        setDecisions((prev) => ({
            ...prev,
            [index]: { type: "existing", candidateId, recordedQty },
        }));
    }

    function handleMarkAsNewItem(index: number) {
        setDecisions((prev) => ({
            ...prev,
            [index]: { type: "new" },
        }));
    }

    function handleRecordedQtyChange(index: number, value: number) {
        setDecisions((prev) => {
            const current = prev[index];
            if (!current || current.type !== "existing") return prev;
            return {
                ...prev,
                [index]: { ...current, recordedQty: Math.max(0, value) },
            };
        });
    }

    function handleSave() {
        if (!matches || !result) return;

        setIsSaving(true);

        // Simulasi proses simpan ke sistem
        setTimeout(() => {
            const rows: SavedRecapRow[] = matches.map((match, index) => {
                const decision = decisions[index];
                const resultItem = result.items[index];
                const purchaseQty = resultItem?.quantity ?? 0;

                let matchedLabel: string | undefined;
                let recordedQty: number | undefined;
                let recordedUnit: string | undefined;
                let pricePerRecordedUnit: number | undefined;

                if (decision?.type === "existing") {
                    const candidate = match.candidates.find(
                        (c) => c.id === decision.candidateId
                    );
                    if (candidate) {
                        matchedLabel = `${candidate.nama108} · ${candidate.namaBarang}`;
                        recordedUnit = candidate.satuan;
                        recordedQty = decision.recordedQty ?? purchaseQty;
                        const totalNominal = match.price * purchaseQty;
                        pricePerRecordedUnit =
                            recordedQty > 0 ? totalNominal / recordedQty : 0;
                    }
                }

                return {
                    description: match.description,
                    quantity: purchaseQty,
                    unit: resultItem?.unit ?? match.unit,
                    decision,
                    matchedLabel,
                    recordedQty,
                    recordedUnit,
                    pricePerRecordedUnit,
                };
            });

            setSavedRecap({
                referenceNumber: `SP-${Date.now().toString().slice(-8)}`,
                savedAt: new Date(),
                rows,
            });
            setIsSaving(false);
        }, 900);
    }

    const totalKeseluruhan =
        result?.items.reduce((sum, item) => sum + item.total_price, 0) ?? 0;

    // Kasih id stabil per baris untuk react-aria Table collection
    const itemsWithId = useMemo(
        () =>
            result?.items.map((item, index) => ({
                ...item,
                id: index,
            })) ?? [],
        [result]
    );

    const totalItems = matches?.length ?? 0;
    const resolvedCount = matches
        ? matches.filter((_, index) => decisions[index] !== undefined).length
        : 0;
    const allResolved = totalItems > 0 && resolvedCount === totalItems;

    return (
        <div className="flex flex-col gap-4">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex items-center gap-3">
                <Button onPress={handlePickFile} isDisabled={isPending}>
                    Upload PDF Surat Pesanan
                </Button>
                {isPending && <Spinner size="sm" />}
                {errorMessage && <Chip color="danger">{errorMessage}</Chip>}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Kiri: preview PDF */}
                <Card className="h-[75vh]">
                    <CardHeader className="font-medium">Preview PDF</CardHeader>
                    <CardContent className="p-0">
                        {previewUrl ? (
                            <iframe
                                src={previewUrl}
                                title="Preview Surat Pesanan"
                                className="h-full w-full rounded-b-lg"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-default-400">
                                Belum ada file yang dipilih
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Kanan: Bagian A - tabel hasil ekstraksi */}
                <Card className="h-[75vh] overflow-auto">
                    <CardHeader className="font-medium">
                        Bagian A — Hasil Ekstraksi
                    </CardHeader>
                    <CardContent>
                        {!result && !isPending && (
                            <div className="flex h-full items-center justify-center text-default-400">
                                Hasil ekstraksi akan tampil di sini
                            </div>
                        )}

                        {result && (
                            <div className="flex flex-col gap-3">
                                <div className="text-sm text-default-500">
                                    {result.document_type && (
                                        <div>Jenis Dokumen: {result.document_type}</div>
                                    )}
                                    {result.transaction_date && (
                                        <div>Tanggal: {result.transaction_date}</div>
                                    )}
                                </div>

                                <Table>
                                    <Table.ScrollContainer>
                                        <Table.Content
                                            aria-label="Tabel hasil ekstraksi surat pesanan"
                                            className="min-w-[600px]"
                                        >
                                            <TableHeader>
                                                <TableColumn isRowHeader>DESKRIPSI</TableColumn>
                                                <TableColumn>QTY</TableColumn>
                                                <TableColumn>SATUAN</TableColumn>
                                                <TableColumn>HARGA SATUAN</TableColumn>
                                                <TableColumn>TOTAL</TableColumn>
                                            </TableHeader>
                                            <TableBody items={itemsWithId}>
                                                {(item) => (
                                                    <TableRow key={item.id} id={item.id}>
                                                        <TableCell>{item.description}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{item.unit}</TableCell>
                                                        <TableCell>
                                                            {formatRupiah(item.unit_price)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatRupiah(item.total_price)}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table.Content>
                                    </Table.ScrollContainer>
                                </Table>

                                <div className="flex justify-end text-sm font-medium">
                                    Total: {formatRupiah(totalKeseluruhan)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bagian B: rekomendasi kodefikasi per item */}
            {(isMatching || matches || matchError) && (
                <Card>
                    <CardHeader className="flex items-center justify-between font-medium">
                        <span>Bagian B — Rekomendasi Kodefikasi Persediaan</span>
                        {matches && matches.length > 0 && !savedRecap && (
                            <Chip
                                size="sm"
                                color={allResolved ? "success" : "default"}
                            >
                                {resolvedCount}/{totalItems} item dipilih
                            </Chip>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isMatching && (
                            <div className="flex items-center gap-2 text-sm text-default-500">
                                <Spinner size="sm" />
                                Mencari kodefikasi paling cocok...
                            </div>
                        )}

                        {!isMatching && matchError && (
                            <Chip color="danger">{matchError}</Chip>
                        )}

                        {/* Rekap setelah "disimpan" */}
                        {!isMatching && savedRecap && (
                            <div className="flex flex-col gap-4">
                                <div className="rounded-lg border border-success-200 bg-success-50 p-3">
                                    <div className="flex items-center gap-2 text-success-700 font-medium">
                                        <span>✓ Berhasil disimpan ke sistem</span>
                                    </div>
                                    <div className="mt-1 text-xs text-default-500">
                                        No. Referensi: {savedRecap.referenceNumber} · Disimpan
                                        pada{" "}
                                        {savedRecap.savedAt.toLocaleString("id-ID", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </div>
                                </div>

                                <Table>
                                    <Table.ScrollContainer>
                                        <Table.Content
                                            aria-label="Rekap barang tersimpan"
                                            className="min-w-[700px]"
                                        >
                                            <TableHeader>
                                                <TableColumn isRowHeader>DESKRIPSI</TableColumn>
                                                <TableColumn>QTY BELI</TableColumn>
                                                <TableColumn>QTY DICATAT</TableColumn>
                                                <TableColumn>HARGA/UNIT DICATAT</TableColumn>
                                                <TableColumn>STATUS</TableColumn>
                                            </TableHeader>
                                            <TableBody
                                                items={savedRecap.rows.map((row, i) => ({
                                                    ...row,
                                                    id: i,
                                                }))}
                                            >
                                                {(row) => (
                                                    <TableRow key={row.id} id={row.id}>
                                                        <TableCell>{row.description}</TableCell>
                                                        <TableCell>
                                                            {row.quantity} {row.unit}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.decision?.type === "existing"
                                                                ? `${row.recordedQty} ${row.recordedUnit ?? ""}`
                                                                : "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.decision?.type === "existing" &&
                                                                row.pricePerRecordedUnit !== undefined
                                                                ? formatRupiah(row.pricePerRecordedUnit)
                                                                : "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.decision?.type === "new" ? (
                                                                <Chip size="sm">Barang Baru</Chip>
                                                            ) : (
                                                                <Chip size="sm" color="success">
                                                                    {row.matchedLabel ?? "Sudah dikodefikasi"}
                                                                </Chip>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table.Content>
                                    </Table.ScrollContainer>
                                </Table>
                            </div>
                        )}

                        {/* Daftar pilihan kandidat, sebelum disimpan */}
                        {!isMatching && matches && !savedRecap && (
                            <div className="flex flex-col gap-4">
                                {matches.map((match, index) => {
                                    const decision = decisions[index];
                                    const selectedCandidateId =
                                        decision?.type === "existing"
                                            ? decision.candidateId
                                            : undefined;
                                    const isMarkedNew = decision?.type === "new";

                                    const resultItem = result?.items[index];
                                    const purchaseQty = resultItem?.quantity ?? 0;
                                    const purchaseUnit = match.unit;
                                    const totalNominal = match.price * purchaseQty;

                                    const selectedCandidate =
                                        decision?.type === "existing"
                                            ? match.candidates.find(
                                                (c) => c.id === decision.candidateId
                                            )
                                            : undefined;
                                    const conversionFactor = selectedCandidate
                                        ? getConversionFactor(
                                            purchaseUnit,
                                            selectedCandidate.satuan
                                        )
                                        : null;
                                    const recordedQty =
                                        decision?.type === "existing"
                                            ? decision.recordedQty
                                            : undefined;
                                    const pricePerRecordedUnit =
                                        recordedQty && recordedQty > 0
                                            ? totalNominal / recordedQty
                                            : 0;

                                    return (
                                        <div
                                            key={index}
                                            className={[
                                                "rounded-lg border p-3",
                                                decision
                                                    ? "border-default-200"
                                                    : "border-warning-300 bg-warning-50/40",
                                            ].join(" ")}
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-medium">
                                                <span>
                                                    {match.description} • {formatRupiah(match.price)}{" "}
                                                    <Chip>{match.unit}</Chip>
                                                </span>
                                                {!decision && (
                                                    <Chip size="sm" color="warning">
                                                        Belum dipilih
                                                    </Chip>
                                                )}
                                            </div>

                                            {match.candidates.length === 0 && (
                                                <div className="mb-2 text-sm text-default-400">
                                                    Tidak ada kodefikasi yang cukup mirip ditemukan
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-2">
                                                {match.candidates.map((candidate) => {
                                                    const isSelected = candidate.id === selectedCandidateId;

                                                    return (
                                                        <button
                                                            key={candidate.id}
                                                            type="button"
                                                            onClick={() => handleSelectCandidate(index, candidate.id)}
                                                            aria-pressed={isSelected}
                                                            className={[
                                                                "relative flex w-full items-center justify-between gap-3 rounded-md border-2 p-2 pl-3 text-left text-sm transition-all",
                                                                isSelected
                                                                    ? "border-primary bg-primary-50 ring-2 ring-primary-200"
                                                                    : "border-default-200 hover:border-default-300 hover:bg-default-50 opacity-90 hover:opacity-100",
                                                            ].join(" ")}
                                                        >
                                                            {/* Indikator radio bulat di kiri */}
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className={[
                                                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                                                        isSelected
                                                                            ? "border-primary bg-primary text-white"
                                                                            : "border-default-300 bg-white",
                                                                    ].join(" ")}
                                                                >
                                                                    {isSelected && (
                                                                        <svg
                                                                            viewBox="0 0 20 20"
                                                                            fill="currentColor"
                                                                            className="h-3 w-3"
                                                                        >
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415L8.5 12.086l6.79-6.79a1 1 0 011.414 0z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                </span>

                                                                <div>
                                                                    <div
                                                                        className={[
                                                                            "font-medium",
                                                                            isSelected ? "text-primary-700" : "text-default-700",
                                                                        ].join(" ")}
                                                                    >
                                                                        {candidate.namaBarang} • <Chip>{candidate.satuan}</Chip>
                                                                    </div>
                                                                    <div className="text-xs text-default-500">
                                                                        {candidate.id} • {candidate.kategori} • {candidate.nama108}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {isSelected && (
                                                                    <span className="text-xs font-medium text-primary-600">
                                                                        Terpilih
                                                                    </span>
                                                                )}
                                                                <Chip
                                                                    size="sm"
                                                                    color={getSimilarityColor(candidate.similarity)}
                                                                >
                                                                    {Math.round(candidate.similarity * 100)}%
                                                                </Chip>
                                                            </div>
                                                        </button>
                                                    );
                                                })}

                                                {/* Opsi tandai sebagai barang baru */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkAsNewItem(index)}
                                                    aria-pressed={isMarkedNew}
                                                    className={[
                                                        "relative flex w-full items-center justify-between gap-3 rounded-md border-2 border-dashed p-2 pl-3 text-left text-sm transition-all",
                                                        isMarkedNew
                                                            ? "border-secondary bg-secondary-50 ring-2 ring-secondary-200"
                                                            : "border-default-300 hover:border-default-400 hover:bg-default-50",
                                                    ].join(" ")}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={[
                                                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                                                isMarkedNew
                                                                    ? "border-secondary bg-secondary text-white"
                                                                    : "border-default-300 bg-white",
                                                            ].join(" ")}
                                                        >
                                                            {isMarkedNew && (
                                                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415L8.5 12.086l6.79-6.79a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </span>
                                                        <div
                                                            className={[
                                                                "font-medium",
                                                                isMarkedNew ? "text-secondary-700" : "text-default-600",
                                                            ].join(" ")}
                                                        >
                                                            + Tandai sebagai barang baru
                                                        </div>
                                                    </div>

                                                    {isMarkedNew && (
                                                        <span className="text-xs font-medium text-secondary-600">
                                                            Dipilih
                                                        </span>
                                                    )}
                                                </button>

                                                {/* Panel konversi jumlah pencatatan, muncul setelah kandidat dipilih */}
                                                {decision?.type === "existing" && selectedCandidate && (
                                                    <div className="mt-1 rounded-md border border-primary-200 bg-primary-50/50 p-3">
                                                        <div className="mb-2 text-xs font-medium text-primary-700">
                                                            Jumlah & Harga Pencatatan
                                                        </div>

                                                        {conversionFactor && (
                                                            <div className="mb-2 text-xs text-default-500">
                                                                Asumsi konversi: 1 {purchaseUnit} = {conversionFactor}{" "}
                                                                {selectedCandidate.satuan}
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap items-end gap-4">
                                                            <label className="flex flex-col gap-1 text-xs text-default-600">
                                                                Jumlah dicatat ({selectedCandidate.satuan})
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={decision.recordedQty}
                                                                    onChange={(e) =>
                                                                        handleRecordedQtyChange(
                                                                            index,
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="w-32 rounded-md border border-default-300 px-2 py-1 text-sm"
                                                                />
                                                            </label>

                                                            <div className="text-xs text-default-600">
                                                                Harga per {selectedCandidate.satuan}:{" "}
                                                                <span className="font-medium text-default-800">
                                                                    {formatRupiah(pricePerRecordedUnit)}
                                                                </span>
                                                            </div>

                                                            <div className="text-xs text-default-400">
                                                                (Total nominal tetap {formatRupiah(totalNominal)})
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    {!allResolved && (
                                        <span className="text-xs text-default-400">
                                            Pilih kodefikasi atau tandai barang baru untuk semua
                                            item sebelum menyimpan
                                        </span>
                                    )}
                                    <Button
                                        isDisabled={!allResolved || isSaving}
                                        onPress={handleSave}
                                    >
                                        {isSaving && <Spinner size="sm" className="mr-2" />}
                                        Simpan ke Sistem
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
}

function getSimilarityColor(
    similarity: number
): "success" | "warning" | "danger" {
    if (similarity >= 0.85) return "success";
    if (similarity >= 0.6) return "warning";
    return "danger";
}