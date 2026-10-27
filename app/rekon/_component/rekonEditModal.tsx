"use client";
import { useState } from "react";
import { Alert, Button, Chip, Input, Label, Modal, toast } from "@heroui/react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { actionEditRekon } from "@/action/rekon/action.update";
import { RekonContract } from "@/action/rekon/contract";
import { getSelisihStatus } from "./rekonStatus";
import {
    BULAN_LABEL,
    REKON_TYPE_LABEL,
    formatRupiah,
    getErrorMessage,
    hitungSelisih,
    nominalToInput,
    parseNominalInput,
    type RekonRow,
} from "./rekonUtil";

// Hanya mengubah inputBMD. Bulan, tahun, jenis rekon, perangkat daerah, dan
// realisasiAnggaran tampil read-only dan tidak ikut dikirim ke server.
export default function RekonEditModal({
    target,
    queryKey,
    onClose,
}: {
    target: RekonRow;
    queryKey: QueryKey;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [value, setValue] = useState(() => nominalToInput(target.inputBMD));
    const [fieldError, setFieldError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (input: RekonContract.EditDTO) => {
            const res = await actionEditRekon(input);
            if (!res.success) throw res.error;
            return res.data;
        },
        onSuccess: (updated) => {
            // Gabungkan hasil update ke cache; nama perangkat daerah tetap dari baris lama.
            queryClient.setQueryData<RekonRow[]>(queryKey, (old) =>
                old?.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
            );
            toast.success("Input BMD berhasil diperbarui");
            onClose();
        },
        // Modal tetap terbuka dan isian pengguna tidak diubah saat gagal.
        onError: (error: unknown) => {
            toast.danger("Gagal menyimpan input BMD", { description: getErrorMessage(error) });
        },
    });

    // Pratinjau selisih mengikuti isian pengguna (hanya tampilan, tidak dikirim ke server).
    const nominalPreview = parseNominalInput(value);
    const previewSelisih =
        nominalPreview === null
            ? null
            : hitungSelisih({ realisasiAnggaran: target.realisasiAnggaran, inputBMD: nominalPreview });
    const previewStatus = previewSelisih ? getSelisihStatus(previewSelisih) : null;

    const submit = () => {
        if (mutation.isPending) return;
        const nominal = parseNominalInput(value);
        if (nominal === null) {
            setFieldError("Isi nominal yang valid, mis. 1500000 atau 1500000,50");
            return;
        }
        const parsed = RekonContract.edit.safeParse({ id: target.id, inputBMD: nominal });
        if (!parsed.success) {
            setFieldError(parsed.error.issues[0]?.message ?? "Nominal tidak valid");
            return;
        }
        setFieldError(null);
        mutation.mutate(parsed.data);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !mutation.isPending) onClose();
    };

    return (
        <Modal isOpen onOpenChange={handleOpenChange}>
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                                    <Pencil size={18} />
                                </span>
                                <Modal.Heading>Edit Input BMD</Modal.Heading>
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-5">
                                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
                                    <dt className="text-muted">Perangkat Daerah</dt>
                                    <dd className="text-right font-medium">{target.perangkatDaerahNama}</dd>
                                    <dt className="text-muted">Jenis Rekon</dt>
                                    <dd className="text-right">{REKON_TYPE_LABEL[target.rekonType]}</dd>
                                    <dt className="text-muted">Periode</dt>
                                    <dd className="text-right">
                                        {BULAN_LABEL[target.bulan - 1]} {target.tahun}
                                    </dd>
                                    <dt className="text-muted">Realisasi</dt>
                                    <dd className="text-right font-medium tabular-nums">
                                        {formatRupiah(target.realisasiAnggaran)}
                                    </dd>
                                </dl>

                                {mutation.isError && (
                                    <Alert status="danger">
                                        <Alert.Indicator />
                                        <Alert.Content>
                                            <Alert.Title>Gagal menyimpan</Alert.Title>
                                            <Alert.Description>{getErrorMessage(mutation.error)}</Alert.Description>
                                        </Alert.Content>
                                    </Alert>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <Label>Input BMD (Rp)</Label>
                                    <Input
                                        autoFocus
                                        inputMode="decimal"
                                        placeholder="mis. 1500000,50"
                                        value={value}
                                        aria-invalid={fieldError !== null}
                                        disabled={mutation.isPending}
                                        onChange={(e) => {
                                            setValue(e.target.value);
                                            if (fieldError) setFieldError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") submit();
                                        }}
                                    />
                                    {fieldError ? (
                                        <p className="text-sm text-danger">{fieldError}</p>
                                    ) : (
                                        <p className="text-xs text-muted">
                                            Gunakan koma untuk desimal. Titik diabaikan sebagai pemisah ribuan.
                                        </p>
                                    )}
                                </div>

                                {/* Pratinjau selisih */}
                                <div
                                    className={`flex items-center justify-between rounded-2xl px-4 py-3 ${previewStatus ? previewStatus.softBgClass : "bg-default text-muted"
                                        }`}
                                >
                                    <div>
                                        <p className="text-xs uppercase tracking-wider opacity-80">
                                            Kurang/Lebih
                                        </p>
                                        <p className="font-semibold tabular-nums">
                                            {previewSelisih ? formatRupiah(previewSelisih) : "—"}
                                        </p>
                                    </div>
                                    {previewStatus && (
                                        <Chip size="sm" variant="soft" color={previewStatus.chipColor}>
                                            <Chip.Label>{previewStatus.label}</Chip.Label>
                                        </Chip>
                                    )}
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" isDisabled={mutation.isPending} onPress={onClose}>
                                Batal
                            </Button>
                            <Button isDisabled={mutation.isPending} onPress={submit}>
                                {mutation.isPending ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}