"use client";
import { useCallback, useRef, useState } from "react";
import { Button, Chip, Modal, Spinner, toast, useOverlayState } from "@heroui/react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Download, Pencil, Trash2 } from "lucide-react";
import {
    actionDeleteBerkasRekon,
    actionGetDownloadUrlBerkasRekon,
    actionGetPresignedUrlBerkasRekon,
    actionGetPreviewUrlBerkasRekon,
    actionUpdateBerkasRekon,
} from "@/action/rekon/action.berkas";
import { PreviewBerkas } from "@/component/berkas/previewBerkas";
import { FileDropzone, errMessage, useUploadBerkas } from "@/component/berkas/uploadBerkas";
import {
    REKON_BERKAS_CONFIG,
    getBerkasFileName,
    getBerkasKey,
    withBerkasKey,
    type RekonBerkasTipe,
} from "./rekonBerkas";
import { BULAN_LABEL, REKON_TYPE_LABEL, type RekonRow } from "./rekonUtil";

// Mengelola satu dokumen (kertas kerja / BA) untuk satu baris rekon.
// `row` selalu diambil dari cache query oleh induk, jadi status dokumen tidak basi
// dan tidak pernah tercampur dengan baris lain.
export default function RekonBerkasModal({
    row,
    tipe,
    queryKey,
    onClose,
}: {
    row: RekonRow;
    tipe: RekonBerkasTipe;
    queryKey: QueryKey;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const config = REKON_BERKAS_CONFIG[tipe];
    const fileKey = getBerkasKey(row, tipe);
    const fileName = getBerkasFileName(fileKey);
    const [busy, setBusy] = useState(false); // upload/hapus/unduh sedang berjalan

    // Perbarui hanya field dokumen ini pada baris yang sama; sisanya dipertahankan.
    const applyKey = useCallback(
        (key: string | null) => {
            queryClient.setQueryData<RekonRow[]>(queryKey, (old) =>
                old?.map((r) => (r.id === row.id ? withBerkasKey(r, tipe, key) : r)),
            );
        },
        [queryClient, queryKey, row.id, tipe],
    );

    const handleOpenChange = (open: boolean) => {
        if (!open && !busy) onClose();
    };

    return (
        <Modal isOpen onOpenChange={handleOpenChange}>
            <Modal.Backdrop isDismissable={!busy} isKeyboardDismissDisabled={busy}>
                <Modal.Container size={tipe === "ba" ? "lg" : "md"}>
                    <Modal.Dialog>
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                                    <config.icon size={18} />
                                </span>
                                <Modal.Heading>{config.label}</Modal.Heading>
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-5">
                                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
                                    <dt className="text-muted">Perangkat Daerah</dt>
                                    <dd className="text-right font-medium">{row.perangkatDaerahNama}</dd>
                                    <dt className="text-muted">Jenis Rekon</dt>
                                    <dd className="text-right">{REKON_TYPE_LABEL[row.rekonType]}</dd>
                                    <dt className="text-muted">Periode</dt>
                                    <dd className="text-right">
                                        {BULAN_LABEL[row.bulan - 1]} {row.tahun}
                                    </dd>
                                    <dt className="text-muted">Status</dt>
                                    <dd className="flex justify-end">
                                        <Chip
                                            size="sm"
                                            variant="soft"
                                            color={fileKey ? "success" : "warning"}
                                        >
                                            <Chip.Label>{fileKey ? "Sudah diunggah" : "Belum diunggah"}</Chip.Label>
                                        </Chip>
                                    </dd>
                                </dl>

                                {tipe === "ba" ? (
                                    <BeritaAcaraBody
                                        row={row}
                                        fileKey={fileKey}
                                        onKeyChange={applyKey}
                                        setBusy={setBusy}
                                    />
                                ) : (
                                    <KertasKerjaBody
                                        row={row}
                                        fileKey={fileKey}
                                        fileName={fileName}
                                        onKeyChange={applyKey}
                                        setBusy={setBusy}
                                    />
                                )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" isDisabled={busy} onPress={onClose}>
                                Tutup
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}

/* ------------------------------------------------------------------ */
/* Unduh: minta presigned GET URL dari server, lalu picu unduhan.      */
/* ------------------------------------------------------------------ */

function DownloadButton({
    row,
    tipe,
    onBusyChange,
}: {
    row: RekonRow;
    tipe: RekonBerkasTipe;
    onBusyChange: (busy: boolean) => void;
}) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        onBusyChange(true);
        try {
            const res = await actionGetDownloadUrlBerkasRekon(row.id, tipe);
            if (!res.success) {
                throw res.error
            }
            if (!res.data) {
                throw "Gagal menyiapkan tautan unduhan"
            }
            const a = document.createElement("a");
            a.href = res.data;
            a.rel = "noopener";
            a.download = "";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            toast.danger("Gagal mengunduh", { description: errMessage(err) });
        } finally {
            setIsDownloading(false);
            onBusyChange(false);
        }
    };

    return (
        <Button variant="primary" onPress={handleDownload} isPending={isDownloading}>
            {({ isPending }) => (
                <>
                    {isPending ? <Spinner color="current" size="sm" /> : <Download size={16} />}
                    {REKON_BERKAS_CONFIG[tipe].downloadLabel}
                </>
            )}
        </Button>
    );
}

/* ------------------------------------------------------------------ */
/* Berita Acara (PDF): pakai PreviewBerkas apa adanya.                 */
/* ------------------------------------------------------------------ */

function BeritaAcaraBody({
    row,
    fileKey,
    onKeyChange,
    setBusy,
}: {
    row: RekonRow;
    fileKey: string | null;
    onKeyChange: (key: string | null) => void;
    setBusy: (busy: boolean) => void;
}) {
    const config = REKON_BERKAS_CONFIG.ba;
    return (
        <div className="flex flex-col gap-4">
            <PreviewBerkas
                title={config.label}
                description={
                    fileKey ? undefined : `Berita acara belum diunggah. Unggah berkas ${config.extLabel} hasil scan.`
                }
                fileKey={fileKey}
                accept={config.accept}
                maxSizeMB={config.maxSizeMB}
                getPresignedUrl={() => actionGetPresignedUrlBerkasRekon(row.id, "ba")}
                getPreviewUrl={() => actionGetPreviewUrlBerkasRekon(row.id, "ba")}
                updateBerkas={(key) => actionUpdateBerkasRekon(row.id, "ba", key)}
                deleteBerkas={() => actionDeleteBerkasRekon(row.id, "ba")}
                onChange={(key) => onKeyChange(key)}
            />
            {fileKey && (
                <div className="flex justify-end">
                    <DownloadButton row={row} tipe="ba" onBusyChange={setBusy} />
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Kertas Kerja (XLSX): tanpa iframe. Upload memakai useUploadBerkas.   */
/* ------------------------------------------------------------------ */

function KertasKerjaBody({
    row,
    fileKey,
    fileName,
    onKeyChange,
    setBusy,
}: {
    row: RekonRow;
    fileKey: string | null;
    fileName: string | null;
    onKeyChange: (key: string | null) => void;
    setBusy: (busy: boolean) => void;
}) {
    const config = REKON_BERKAS_CONFIG.kertasKerja;
    const rowId = row.id;

    // Ref menjaga callback tetap stabil tanpa memakai closure basi.
    const onKeyChangeRef = useRef(onKeyChange);
    onKeyChangeRef.current = onKeyChange;

    const updateBerkas = useCallback((key: string) => actionUpdateBerkasRekon(rowId, "kertasKerja", key), [rowId]);
    const getPresignedUrl = useCallback(() => actionGetPresignedUrlBerkasRekon(rowId, "kertasKerja"), [rowId]);

    const { start, isPreparing, modal: uploadModal } = useUploadBerkas({
        getPresignedUrl,
        updateBerkas,
        accept: config.accept,
        maxSizeMB: config.maxSizeMB,
        modalTitle: fileKey ? "Ganti kertas kerja" : "Upload kertas kerja",
        onSuccess: (key) => onKeyChangeRef.current(key),
    });

    /* ---- hapus (dengan konfirmasi) ---- */
    const deleteState = useOverlayState();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        setBusy(true);
        try {
            const res = await actionDeleteBerkasRekon(rowId, "kertasKerja");
            if (!res.success) throw res.error;
            toast.success("Kertas kerja berhasil dihapus");
            deleteState.close();
            onKeyChangeRef.current(null);
        } catch (err) {
            toast.danger("Gagal menghapus", { description: errMessage(err) });
        } finally {
            setIsDeleting(false);
            setBusy(false);
        }
    };

    return (
        <>
            {fileKey ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
                            <config.icon size={20} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wider text-muted">Berkas tersimpan</p>
                            <p className="truncate font-medium">{fileName ?? "kertas-kerja.xlsx"}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="ghost"
                            className="text-danger"
                            isDisabled={isPreparing || isDeleting}
                            onPress={deleteState.open}
                        >
                            <Trash2 size={16} />
                            Hapus Berkas
                        </Button>
                        <Button
                            variant="outline"
                            isDisabled={isDeleting}
                            isPending={isPreparing}
                            onPress={() => start()}
                        >
                            {({ isPending }) => (
                                <>
                                    {isPending ? <Spinner color="current" size="sm" /> : <Pencil size={16} />}
                                    Ganti Berkas
                                </>
                            )}
                        </Button>
                        <DownloadButton row={row} tipe="kertasKerja" onBusyChange={setBusy} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted">
                        Kertas kerja belum diunggah. Pilih atau seret berkas {config.extLabel} (maks.{" "}
                        {config.maxSizeMB} MB).
                    </p>
                    <FileDropzone
                        accept={config.accept}
                        maxSizeMB={config.maxSizeMB}
                        disabled={isPreparing}
                        onFile={(f) => start(f)}
                        className="h-56 w-full"
                    />
                </div>
            )}

            {/* modal upload / ganti berkas */}
            {uploadModal}

            {/* konfirmasi hapus */}
            <Modal state={deleteState}>
                <Modal.Backdrop isDismissable={!isDeleting} isKeyboardDismissDisabled={isDeleting}>
                    <Modal.Container size="sm">
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>Hapus kertas kerja?</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <p className="text-sm text-muted">
                                    Kertas kerja <span className="font-medium text-foreground">{fileName}</span>{" "}
                                    milik {row.perangkatDaerahNama} akan dihapus dan tidak bisa dikembalikan.
                                    Berita acara tidak terpengaruh.
                                </p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="ghost" isDisabled={isDeleting} onPress={() => deleteState.close()}>
                                    Batal
                                </Button>
                                <Button variant="danger" onPress={handleDelete} isPending={isDeleting}>
                                    {({ isPending }) => (
                                        <>
                                            {isPending && <Spinner color="current" size="sm" />}
                                            Hapus
                                        </>
                                    )}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}