"use client";

import { useRef, useState } from "react";
import {
    Modal,
    Button,
    toast,
} from "@heroui/react";
import { uploadPolygonAction } from "@/action/sebaranBmd/sebaranBmd.action";

interface Props {
    nibar: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

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

export function UploadPolygonModal({ nibar, isOpen, onClose, onSuccess }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [geoJsonText, setGeoJsonText] = useState<string | null>(null);
    const [sourceLabel, setSourceLabel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pasting, setPasting] = useState(false);

    // Trigger file picker → otomatis proses setelah pilih
    function handleClickUpload() {
        fileRef.current?.click();
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

        setError(null);
        setGeoJsonText(text);
        setSourceLabel(file.name);
        // reset input so same file can be re-selected
        e.target.value = "";
    }

    async function handlePaste() {
        setPasting(true);
        setError(null);
        setGeoJsonText(null);
        setSourceLabel(null);
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                setError("Clipboard kosong.");
                return;
            }
            const { valid, message } = validateGeoJSON(text);
            if (!valid) {
                setError(message ?? "GeoJSON tidak valid.");
                return;
            }
            setGeoJsonText(text);
            setSourceLabel("Clipboard");
        } catch {
            setError("Tidak dapat membaca clipboard. Pastikan izin browser diberikan.");
        } finally {
            setPasting(false);
        }
    }

    async function handleUpload() {
        if (!geoJsonText) return;

        setLoading(true);
        try {
            const result = await uploadPolygonAction(nibar, geoJsonText);
            if (result.success) {
                toast.success(result.message);
                onSuccess();
                handleClose();
            } else {
                toast.danger(`Gagal mengunggah GeoJSON: ${result.message}`);
            }
        } catch {
            toast.danger("Terjadi kesalahan tak terduga.");
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setGeoJsonText(null);
        setSourceLabel(null);
        setError(null);
        if (fileRef.current) fileRef.current.value = "";
        onClose();
    }

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger onPress={handleClose} />

                        <Modal.Header>
                            <Modal.Heading>Upload Polygon</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="gap-4">
                            {/* NIBAR */}
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-default-500">NIBAR</span>
                                <span className="font-mono font-semibold">{nibar}</span>
                            </div>

                            {/* 2 tombol aksi */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onPress={handleClickUpload}
                                    isDisabled={loading}
                                >
                                    Upload GeoJSON
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onPress={handlePaste}
                                    isPending={pasting}
                                    isDisabled={loading}
                                >
                                    Paste dari Clipboard
                                </Button>
                            </div>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept=".geojson,application/geo+json"
                                ref={fileRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Error */}
                            {error && (
                                <p className="text-sm text-danger">{error}</p>
                            )}

                            {/* Preview jika sudah ada GeoJSON */}
                            {geoJsonText && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-success-50 border border-success-200">
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
                                        onPress={() => { setGeoJsonText(null); setSourceLabel(null); }}
                                        isDisabled={loading}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            )}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="outline" onPress={handleClose} isDisabled={loading}>
                                Batal
                            </Button>
                            <Button
                                onPress={handleUpload}
                                isPending={loading}
                                isDisabled={!geoJsonText}
                            >
                                Upload
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}