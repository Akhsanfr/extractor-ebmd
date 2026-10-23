"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, CardProps, Modal, Skeleton, Spinner, toast, useOverlayState } from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";

import {
    FileDropzone,
    errMessage,
    useUploadBerkas,
    type ActionResult,
    type UploadBerkasOptions,
} from "./uploadBerkas";

export interface BerkasPreviewCardProps<TUpdate = unknown>
    extends Pick<
        UploadBerkasOptions,
        "getPresignedUrl" | "accept" | "maxSizeMB" | "extractKey"
    > {
    title?: string;
    description?: string;
    /** Key berkas saat ini dari DB. Kosong/null -> tampilkan dropzone. */
    fileKey?: string | null;
    /**
     * Status query induk (mis. useQuery permohonan) yang menghasilkan `fileKey`.
     * Selama true, card menampilkan skeleton — dropzone TIDAK ditampilkan,
     * supaya tidak berkedip sebelum data datang.
     */
    isLoading?: boolean;
    /** Query induk gagal. Card menampilkan pesan error, bukan dropzone. */
    isError?: boolean;
    /** Pesan error query induk (opsional). */
    errorMessage?: string;
    /** Aksi tombol "Coba lagi" saat isError, mis. () => query.refetch(). */
    onRetry?: () => void;
    /**
     * Presigned GET URL untuk menampilkan berkas.
     * Contoh: () => actionPresignedViewBerkasAlihStatusPermohonan(permohonanId)
     */
    getPreviewUrl: () => Promise<ActionResult<string>>;
    /**
     * Simpan key berkas ke DB. Data yang dikembalikan (`TUpdate`)
     * diteruskan apa adanya ke `onChange` sebagai argumen kedua.
     * Contoh: (key) => actionUpdateBerkasAlihStatusPermohonan(permohonanId, key)
     */
    updateBerkas: (key: string) => Promise<ActionResult<TUpdate>>;
    /** Contoh: () => actionDeleteBerkasAlihStatusPermohonan(permohonanId) */
    deleteBerkas: () => Promise<ActionResult<unknown>>;
    /**
     * Dipanggil setelah upload/hapus sukses.
     * - Upload: `key` = key berkas baru, `result` = data yang dikembalikan `updateBerkas`.
     * - Hapus : `key` = null, `result` = undefined.
     */
    onChange?: (key: string | null, result?: TUpdate) => void;
    /** Tinggi area preview. Default h-[28rem]. */
    previewClassName?: string;
    className?: string;
    variant?: CardProps["variant"];
}

export function PreviewBerkas<TUpdate = unknown>({
    title = "Berkas",
    description,
    fileKey,
    isLoading = false,
    isError = false,
    errorMessage,
    onRetry,
    getPreviewUrl,
    getPresignedUrl,
    updateBerkas,
    deleteBerkas,
    accept = "application/pdf",
    maxSizeMB = 10,
    extractKey,
    onChange,
    previewClassName = "h-[28rem]",
    className = "",
    variant = "secondary",
}: BerkasPreviewCardProps<TUpdate>) {
    /* ---- preview url ---- */
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    // dinaikkan setelah upload agar preview dimuat ulang walau key-nya sama
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!fileKey) {
            setPreviewUrl(null);
            setPreviewError(null);
            return;
        }

        let cancelled = false;
        setIsLoadingPreview(true);
        setPreviewError(null);

        getPreviewUrl()
            .then((res) => {
                if (cancelled) return;
                if (!res.success || !res.data) {
                    throw new Error(res.message ?? "Gagal memuat preview berkas.");
                }
                setPreviewUrl(res.data);
            })
            .catch((err) => {
                if (!cancelled) setPreviewError(errMessage(err));
            })
            .finally(() => {
                if (!cancelled) setIsLoadingPreview(false);
            });

        return () => {
            cancelled = true;
        };
        // getPreviewUrl sengaja tidak jadi dependency: biasanya closure baru tiap render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileKey, reloadToken]);

    /* ---- upload / edit ---- */
    // Ref ke versi terbaru updateBerkas & onChange, supaya wrapper di bawah
    // tetap stabil tapi tidak pernah memakai closure basi.
    const updateBerkasRef = useRef(updateBerkas);
    updateBerkasRef.current = updateBerkas;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // menyimpan data balikan updateBerkas sampai onSuccess dipanggil
    const updateResultRef = useRef<TUpdate | undefined>(undefined);

    const updateBerkasWrapped = useCallback(async (key: string) => {
        updateResultRef.current = undefined;
        const res = await updateBerkasRef.current(key);
        if (res.success) updateResultRef.current = res.data as TUpdate;
        return res;
    }, []);

    const { start, isPreparing, modal: uploadModal } = useUploadBerkas({
        getPresignedUrl,
        updateBerkas: updateBerkasWrapped,
        accept,
        maxSizeMB,
        extractKey,
        modalTitle: fileKey ? "Ganti berkas" : "Upload berkas",
        onSuccess: (key) => {
            const result = updateResultRef.current;
            updateResultRef.current = undefined;
            setReloadToken((n) => n + 1);
            onChangeRef.current?.(key, result);
        },
    });

    /* ---- delete ---- */
    const deleteState = useOverlayState();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = useCallback(async () => {
        setIsDeleting(true);
        try {
            const res = await deleteBerkas();
            if (!res.success) {
                throw new Error(res.message ?? "Gagal menghapus berkas.");
            }
            toast.success("Berkas berhasil dihapus");
            deleteState.close();
            setPreviewUrl(null);
            onChangeRef.current?.(null);
        } catch (err) {
            toast.danger("Gagal menghapus", { description: errMessage(err) });
        } finally {
            setIsDeleting(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deleteBerkas]);

    const fileName = fileKey?.split("/").pop();

    return (
        <>
            <Card className={`w-full ${className}`} variant={variant}>
                <Card.Header>
                    <Card.Title>{title}</Card.Title>
                    {(description || fileName) && (
                        <Card.Description className="truncate">
                            {description ?? fileName}
                        </Card.Description>
                    )}
                </Card.Header>

                <Card.Content>
                    {isLoading ? (
                        <Skeleton className={`w-full rounded-2xl ${previewClassName}`} />
                    ) : isError ? (
                        <div
                            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 p-6 text-center ${previewClassName}`}
                        >
                            <p className="text-sm text-danger">
                                {errorMessage ?? "Gagal memuat data berkas."}
                            </p>
                            {onRetry && (
                                <Button size="sm" variant="outline" onPress={onRetry}>
                                    Coba lagi
                                </Button>
                            )}
                        </div>
                    ) : fileKey ? (
                        <div
                            className={`relative w-full overflow-hidden  ${previewClassName}`}
                        >
                            {isLoadingPreview && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Spinner size="lg" />
                                </div>
                            )}

                            {!isLoadingPreview && previewError && (
                                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                                    <p className="text-sm text-danger">{previewError}</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onPress={() => setReloadToken((n) => n + 1)}
                                    >
                                        Coba lagi
                                    </Button>
                                </div>
                            )}

                            {!isLoadingPreview && !previewError && previewUrl && (
                                <iframe
                                    key={previewUrl}
                                    src={previewUrl}
                                    title={fileName ?? "Preview berkas"}
                                    className="h-full w-full"
                                />
                            )}
                        </div>
                    ) : (
                        <FileDropzone
                            accept={accept}
                            maxSizeMB={maxSizeMB}
                            disabled={isPreparing}
                            onFile={(f) => start(f)}
                            className={`${previewClassName} w-full`}
                        />
                    )}
                </Card.Content>

                {fileKey && !isLoading && !isError && (
                    <Card.Footer className="justify-end gap-2">
                        <Button
                            variant="ghost"
                            className="text-danger"
                            onPress={deleteState.open}
                            isDisabled={isPreparing}
                        >
                            <Trash2 size={16} />
                            Hapus
                        </Button>
                        <Button variant="outline" onPress={() => start()} isPending={isPreparing}>
                            {({ isPending }) => (
                                <>
                                    {isPending ? (
                                        <Spinner color="current" size="sm" />
                                    ) : (
                                        <Pencil size={16} />
                                    )}
                                    Edit
                                </>
                            )}
                        </Button>
                    </Card.Footer>
                )}
            </Card>

            {/* modal upload / ganti berkas */}
            {uploadModal}

            {/* modal konfirmasi hapus */}
            <Modal state={deleteState}>
                <Modal.Backdrop isDismissable={!isDeleting} isKeyboardDismissDisabled={isDeleting}>
                    <Modal.Container size="sm">
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>Hapus berkas?</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <p className="text-sm text-muted">
                                    Berkas <span className="font-medium text-foreground">{fileName}</span>{" "}
                                    akan dihapus dan tidak bisa dikembalikan.
                                </p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    variant="ghost"
                                    onPress={() => deleteState.close()}
                                    isDisabled={isDeleting}
                                >
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