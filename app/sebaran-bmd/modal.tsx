"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Modal, Button, toast, Spinner, Label, Select, Description, ListBox, TextField, Input } from "@heroui/react";
import {
    updateBmdAction,
    getPolygonGeoJsonAction,
} from "@/action/sebaranBmd/sebaranBmd.action";
import { BmdTanahDTO, SebaranBMDContract } from "@/action/sebaranBmd/sebaranBmd.contract";
import { Clipboard } from "lucide-react";
import { StatusBhumi } from "@/enum/sebaranBmd";

const LeafletMap = dynamic(() => import("./leafletMap"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-56 bg-default-100 rounded-lg">
            <span className="text-sm text-default-400">Memuat peta…</span>
        </div>
    ),
});

interface Props {
    bmd: SebaranBMDContract.SelectDTO;
    namaPic: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateGeoJSON(text: string): { valid: boolean; message?: string } {
    try {
        const parsed = JSON.parse(text);
        if (!parsed.type) return { valid: false, message: "Bukan GeoJSON valid (tidak ada field 'type')." };
        const allowed = ["FeatureCollection", "Feature", "Polygon", "MultiPolygon", "GeometryCollection"];
        if (!allowed.includes(parsed.type)) return { valid: false, message: `Type '${parsed.type}' tidak didukung.` };
        return { valid: true };
    } catch {
        return { valid: false, message: "Format JSON tidak valid." };
    }
}

function getPreviewInfo(text: string): string {
    try {
        const parsed = JSON.parse(text);
        const type = parsed.type;
        const featureCount = parsed.type === "FeatureCollection" ? parsed.features?.length ?? 0 : 1;
        return `${type} · ${featureCount} feature${featureCount !== 1 ? "s" : ""}`;
    } catch {
        return "GeoJSON valid";
    }
}

/** Konversi StatusBhumi value → boolean statusPlotting */
function statusBhumiToBoolean(val: StatusBhumi): boolean {
    return val === StatusBhumi.sudahPlotting;
}

/** Konversi boolean statusPlotting → StatusBhumi */
function booleanToStatusBhumi(val: boolean | null): StatusBhumi | null {
    if (val === null) return null;
    return val ? StatusBhumi.sudahPlotting : StatusBhumi.belumPlotting;
}

const STATUS_BHUMI_LABELS: Record<StatusBhumi, string> = {
    [StatusBhumi.sudahPlotting]: "Sudah Plotting",
    [StatusBhumi.belumPlotting]: "Belum Plotting",
    [StatusBhumi.salahPlotting]: "Salah Plotting",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadPolygonModal({ bmd, namaPic, isOpen, onClose, onSuccess }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [pasting, setPasting] = useState(false);

    // Polygon baru dari paste/file
    const [geoJsonText, setGeoJsonText] = useState<string | null>(null);
    const [sourceLabel, setSourceLabel] = useState<string | null>(null);

    // Polygon existing dari DB (untuk preview)
    const [existingGeoJson, setExistingGeoJson] = useState<string | null>(null);

    // Status yang akan disimpan
    const [statusBhumi, setStatusBhumi] = useState<StatusBhumi | null>(
        booleanToStatusBhumi(bmd.statusPlotting)
    );
    const [keterangan, setKetarangan] = useState(bmd.keterangan)

    const [error, setError] = useState<string | null>(null);

    // Sync status awal ketika bmd berubah (modal dibuka untuk bmd berbeda)
    useEffect(() => {
        if (isOpen) {
            setStatusBhumi(booleanToStatusBhumi(bmd.statusPlotting));
        }
    }, [isOpen, bmd.nibar, bmd.statusPlotting]);

    // Fetch polygon existing saat modal dibuka
    useEffect(() => {
        if (!isOpen) return;

        if (!bmd.polygon) {
            setExistingGeoJson(null);
            return;
        }
        setLoadingExisting(true);
        getPolygonGeoJsonAction(bmd.nibar)
            .then((raw) => {
                if (!raw) { setExistingGeoJson(null); return; }
                const parsed = JSON.parse(raw);
                setExistingGeoJson(JSON.stringify({
                    type: "Feature",
                    geometry: parsed,
                    properties: {},
                }));
            })
            .catch(() => setExistingGeoJson(null))
            .finally(() => setLoadingExisting(false));
    }, [isOpen, bmd.nibar, bmd.polygon]);

    // Preview: GeoJSON baru (paste/file) > existing dari DB
    const previewGeoJson = geoJsonText ?? existingGeoJson;
    const isShowingExisting = !geoJsonText && !!existingGeoJson;

    // Tombol simpan aktif jika: ada GeoJSON baru ATAU status berubah
    const originalStatus = booleanToStatusBhumi(bmd.statusPlotting);
    const statusChanged = statusBhumi !== originalStatus;
    const canSave = !!geoJsonText || statusChanged;

    // ── Handlers ──────────────────────────────────────────────────────────────

    async function handlePaste() {
        setPasting(true);
        setError(null);
        setGeoJsonText(null);
        setSourceLabel(null);
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) { setError("Clipboard kosong."); return; }
            const { valid, message } = validateGeoJSON(text);
            if (!valid) { setError(message ?? "GeoJSON tidak valid."); return; }
            // Paste GeoJSON → otomatis set status sudahPlotting
            setGeoJsonText(text);
            setSourceLabel("Clipboard");
            setStatusBhumi(StatusBhumi.sudahPlotting);
        } catch {
            setError("Tidak dapat membaca clipboard. Pastikan izin browser diberikan.");
        } finally {
            setPasting(false);
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".geojson")) {
            setError("Hanya file .geojson yang diterima.");
            setGeoJsonText(null);
            setSourceLabel(null);
            return;
        }

        const text = await file.text();
        const { valid, message } = validateGeoJSON(text);
        if (!valid) {
            setError(message ?? "GeoJSON tidak valid.");
            setGeoJsonText(null);
            setSourceLabel(null);
            return;
        }

        // Upload file GeoJSON → otomatis set status sudahPlotting
        setError(null);
        setGeoJsonText(text);
        setSourceLabel(file.name);
        setStatusBhumi(StatusBhumi.sudahPlotting);
        e.target.value = "";
    }

    async function handleSimpan() {
        // if (!canSave) return;
        setLoading(true);
        try {
            const result = await updateBmdAction({
                nibar: bmd.nibar,
                updatedBy: namaPic,
                geoJsonString: geoJsonText ?? undefined,
                statusBhumi: statusBhumi,
                keterangan,
            });

            if (result.success) {
                toast.success(result.message);
                onSuccess();
                handleClose();
            } else {
                toast.danger(result.message);
                // Modal tetap terbuka
            }
        } catch {
            toast.danger("Terjadi kesalahan tak terduga.");
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        if (loading) return; // jangan tutup saat sedang proses
        setGeoJsonText(null);
        setSourceLabel(null);
        setError(null);
        setExistingGeoJson(null);
        if (fileRef.current) fileRef.current.value = "";
        onClose();
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger onPress={handleClose} isDisabled={loading} />

                        <Modal.Header>
                            <Modal.Heading>Edit Data Plotting</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className=" p-2">
                            <div className="flex flex-col gap-4">
                                {/* NIBAR */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-default-500">NIBAR</span>
                                    <span className="font-mono font-semibold">{bmd.nibar}</span>
                                </div>

                                {/* Status Select + Paste GeoJSON */}
                                <div className="flex gap-2  items-end">
                                    <Button
                                        onPress={handlePaste}
                                        isPending={pasting}
                                        isDisabled={loading}
                                    >
                                        <Clipboard className="size-4" />
                                        Paste GeoJSON
                                    </Button>
                                    <Select
                                        value={statusBhumi ?? ""}
                                        onChange={(key) =>
                                            setStatusBhumi(key as StatusBhumi || null)
                                        }
                                        isDisabled={loading}
                                    >
                                        <Label>Status Plotting</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                {(Object.entries(StatusBhumi) as [string, StatusBhumi][]).map(
                                                    ([, val]) => (
                                                        <ListBox.Item id={val} key={val} textValue={STATUS_BHUMI_LABELS[val]}>
                                                            <Label>{STATUS_BHUMI_LABELS[val]}</Label>
                                                            <ListBox.ItemIndicator />
                                                        </ListBox.Item>
                                                    )
                                                )}
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                </div>
                                <TextField name="keterangan" value={keterangan ?? ""} onChange={setKetarangan}>
                                    <Label>Keterangan</Label>
                                    <Input placeholder="Misal : beda luas bhumi dengan sertifikat..." />
                                </TextField>

                                <input
                                    type="file"
                                    accept=".geojson,application/geo+json"
                                    ref={fileRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {error && <p className="text-sm text-danger">{error}</p>}

                                {/* Loading existing polygon */}
                                {loadingExisting && (
                                    <div className="flex items-center gap-2 text-sm text-default-500">
                                        <Spinner size="sm" /> Memuat polygon tersimpan…
                                    </div>
                                )}

                                {/* Preview: GeoJSON baru (paste/file) */}
                                {geoJsonText && (
                                    <div className="flex flex-col rounded-lg border border-success-200 overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2 bg-success-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-success-600">✓</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-success-700">{sourceLabel}</span>
                                                    <span className="text-xs text-success-500">{getPreviewInfo(geoJsonText)}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="danger-soft"
                                                onPress={() => {
                                                    setGeoJsonText(null);
                                                    setSourceLabel(null);
                                                    // Kembalikan status ke nilai asli
                                                    setStatusBhumi(booleanToStatusBhumi(bmd.statusPlotting));
                                                }}
                                                isDisabled={loading}
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                        <div className="h-56 w-full">
                                            <LeafletMap geoJson={geoJsonText} />
                                        </div>
                                    </div>
                                )}

                                {/* Preview: polygon existing dari DB */}
                                {isShowingExisting && !loadingExisting && (
                                    <div className="flex flex-col rounded-lg border border-primary-200 overflow-hidden">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50">
                                            <span className="text-primary-600">◉</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-primary-700">Polygon Tersimpan</span>
                                                <span className="text-xs text-primary-500">
                                                    Terakhir diperbarui oleh {bmd.updatedBy ?? "-"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-56 w-full">
                                            <LeafletMap geoJson={existingGeoJson!} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                variant="outline"
                                onPress={handleClose}
                                isDisabled={loading}
                            >
                                Batal
                            </Button>
                            <Button
                                onPress={handleSimpan}
                                isPending={loading}
                            // isDisabled={!canSave || loading}
                            >
                                Simpan
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}