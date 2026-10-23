"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, Modal, Spinner, toast, useOverlayState } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";
import { FileText, UploadCloud, X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Bentuk minimal dari ActionResponse<T> milik project. */
export type ActionResult<T> = {
    success: boolean;
    data?: T;
    message?: string;
};

/**
 * Presigned bisa mengembalikan:
 * - string (url saja) -> key diturunkan dari pathname URL (lihat `extractKey`)
 * - { url, key }      -> disarankan, paling aman
 */
export type PresignedPayload = string | { url: string; key: string };

export interface UploadBerkasOptions {
    /** Contoh: () => actionPresignedUrlBerkasAlihStatusPermohonan(permohonanId) */
    getPresignedUrl: () => Promise<ActionResult<PresignedPayload>>;
    /** Contoh: (key) => actionUpdateBerkasAlihStatusPermohonan(permohonanId, key) */
    updateBerkas: (key: string) => Promise<ActionResult<unknown>>;
    modalTitle?: string;
    /** Atribut `accept` input file, contoh: "application/pdf" atau ".pdf,.jpg" */
    accept?: string;
    maxSizeMB?: number;
    /** Dipanggil setelah upload + updateBerkas sukses, dengan key berkas yang baru. */
    onSuccess?: (key: string) => void;
    /**
     * Dipakai hanya jika presigned mengembalikan string.
     * Default: pathname URL tanpa "/" di depan (virtual-hosted style).
     * Untuk path-style (endpoint/bucket/key) override dan buang nama bucket.
     */
    extractKey?: (url: string) => string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const defaultExtractKey = (url: string) =>
    decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));

export const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export const errMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Terjadi kesalahan.";

const matchesAccept = (file: File, accept?: string) => {
    if (!accept) return true;
    const rules = accept.split(",").map((r) => r.trim().toLowerCase());
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return rules.some((rule) => {
        if (rule.startsWith(".")) return name.endsWith(rule);
        if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
        return type === rule;
    });
};

/** Validasi tipe + ukuran. Menampilkan toast dan return false jika tidak valid. */
function validateFile(file: File, accept: string | undefined, maxSizeMB: number) {
    if (!matchesAccept(file, accept)) {
        toast.warning("Tipe file tidak sesuai", {
            description: `Format yang diterima: ${accept}`,
        });
        return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        toast.warning("File terlalu besar", {
            description: `Maksimal ${maxSizeMB} MB. File kamu ${formatSize(file.size)}.`,
        });
        return false;
    }
    return true;
}

/* -------------------------------------------------------------------------- */
/*  FileDropzone — dipakai di modal dan di card (state kosong)                 */
/* -------------------------------------------------------------------------- */

export interface FileDropzoneProps {
    onFile: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    disabled?: boolean;
    className?: string;
}

export function FileDropzone({
    onFile,
    accept,
    maxSizeMB = 10,
    disabled = false,
    className = "",
}: FileDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const pick = (f: File | undefined | null) => {
        if (!f || disabled) return;
        if (validateFile(f, accept, maxSizeMB)) onFile(f);
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                    pick(e.target.files?.[0]);
                    e.target.value = ""; // boleh pilih file yang sama lagi
                }}
            />
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                aria-label="Pilih file atau seret ke area ini"
                onClick={() => !disabled && inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    pick(e.dataTransfer.files?.[0]);
                }}
                className={[
                    "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-accent",
                    disabled
                        ? "cursor-not-allowed opacity-60 border-border"
                        : isDragging
                            ? "cursor-pointer border-accent bg-accent-soft"
                            : "cursor-pointer border-border hover:border-accent hover:bg-surface",
                    className,
                ].join(" ")}
            >
                {disabled ? (
                    <Spinner size="md" />
                ) : (
                    <UploadCloud size={32} className="text-muted" />
                )}
                <p className="text-sm">
                    Seret file ke sini, atau{" "}
                    <span className="font-medium text-accent">pilih dari perangkat</span>
                </p>
                <p className="text-xs text-muted">
                    {accept ? `${accept} · ` : ""}maks. {maxSizeMB} MB
                </p>
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  useUploadBerkas — logic + modal                                            */
/* -------------------------------------------------------------------------- */

export function useUploadBerkas({
    getPresignedUrl,
    updateBerkas,
    modalTitle = "Upload berkas",
    accept,
    maxSizeMB = 10,
    onSuccess,
    extractKey = defaultExtractKey,
}: UploadBerkasOptions): {
    /** Ambil presigned lalu buka modal. `initialFile` opsional (mis. hasil drop di card). */
    start: (initialFile?: File) => Promise<void>;
    /** True selama presigned sedang diambil. */
    isPreparing: boolean;
    /** Render sekali di mana saja di dalam komponen pemakai. */
    modal: ReactNode;
} {
    const [isPreparing, setIsPreparing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [presigned, setPresigned] = useState<{ url: string; key: string } | null>(null);

    const reset = useCallback(() => {
        setFile(null);
        setPresigned(null);
    }, []);

    const state = useOverlayState({
        onOpenChange: (open) => {
            if (!open) reset();
        },
    });

    /* 1. Ambil presigned -> buka modal */
    const start = async (initialFile?: File) => {
        setIsPreparing(true);
        try {
            const res = await getPresignedUrl();
            if (!res.success || !res.data) {
                throw new Error(res.message ?? "Gagal membuat URL upload.");
            }
            const payload = res.data;
            const url = typeof payload === "string" ? payload : payload.url;
            const key = typeof payload === "string" ? extractKey(payload) : payload.key;
            setPresigned({ url, key });
            setFile(initialFile ?? null);
            state.open();
        } catch (err) {
            toast.danger("Gagal menyiapkan upload", { description: errMessage(err) });
        } finally {
            setIsPreparing(false);
        }
    };

    /* 2. Simpan -> PUT ke bucket -> update berkas -> tutup */
    const save = async () => {
        if (!file || !presigned) return;
        setIsUploading(true);
        try {
            const put = await fetch(presigned.url, {
                method: "PUT",
                body: file,
                headers: file.type ? { "Content-Type": file.type } : undefined,
            });
            if (!put.ok) {
                throw new Error(`Upload ke storage gagal (${put.status}).`);
            }

            const res = await updateBerkas(presigned.key);
            if (!res.success) {
                throw new Error(res.message ?? "Gagal menyimpan data berkas.");
            }

            toast.success("Berkas berhasil diupload");
            state.close();
            onSuccess?.(presigned.key);
        } catch (err) {
            toast.danger("Gagal upload", { description: errMessage(err) });
        } finally {
            setIsUploading(false);
        }
    };

    const modal = (
        <Modal state={state}>
            <Modal.Backdrop isDismissable={!isUploading} isKeyboardDismissDisabled={isUploading}>
                <Modal.Container size="md">
                    <Modal.Dialog>
                        {!isUploading && <Modal.CloseTrigger />}

                        <Modal.Header>
                            <Modal.Heading>{modalTitle}</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body>
                            {file ? (
                                <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
                                    <FileText size={28} className="shrink-0 text-accent" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted">{formatSize(file.size)}</p>
                                    </div>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="ghost"
                                        aria-label="Hapus file"
                                        isDisabled={isUploading}
                                        onPress={() => setFile(null)}
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            ) : (
                                <FileDropzone
                                    accept={accept}
                                    maxSizeMB={maxSizeMB}
                                    onFile={setFile}
                                />
                            )}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                variant="ghost"
                                onPress={() => state.close()}
                                isDisabled={isUploading}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="primary"
                                onPress={save}
                                isPending={isUploading}
                                isDisabled={!file}
                            >
                                {({ isPending }) => (
                                    <>
                                        {isPending && <Spinner color="current" size="sm" />}
                                        Simpan
                                    </>
                                )}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );

    return { start, isPreparing, modal };
}

/* -------------------------------------------------------------------------- */
/*  UploadBerkasButton — tombol standalone                                     */
/* -------------------------------------------------------------------------- */

export interface UploadBerkasButtonProps extends UploadBerkasOptions {
    label?: string;
    buttonProps?: Omit<ButtonProps, "onPress" | "isPending" | "children">;
}

export function UploadBerkasButton({
    label = "Upload berkas",
    buttonProps,
    ...options
}: UploadBerkasButtonProps) {
    const { start, isPreparing, modal } = useUploadBerkas(options);

    return (
        <>
            <Button
                variant="primary"
                {...buttonProps}
                isPending={isPreparing}
                onPress={() => start()}
            >
                {({ isPending }) => (
                    <>
                        {isPending ? <Spinner color="current" size="sm" /> : <UploadCloud size={16} />}
                        {label}
                    </>
                )}
            </Button>
            {modal}
        </>
    );
}