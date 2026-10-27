"use client";
import { useState } from "react";
import { Alert, Button, Input, Label, Modal, toast } from "@heroui/react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { actionEditRekon } from "@/action/rekon/action.update";
import { RekonContract } from "@/action/rekon/contract";
import {
    BULAN_LABEL,
    REKON_TYPE_LABEL,
    formatRupiah,
    getErrorMessage,
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
                            <Modal.Heading>Edit Input BMD</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-4">
                                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                    <dt className="text-muted">Perangkat Daerah</dt>
                                    <dd>{target.perangkatDaerahNama}</dd>
                                    <dt className="text-muted">Jenis Rekon</dt>
                                    <dd>{REKON_TYPE_LABEL[target.rekonType]}</dd>
                                    <dt className="text-muted">Periode</dt>
                                    <dd>
                                        {BULAN_LABEL[target.bulan - 1]} {target.tahun}
                                    </dd>
                                    <dt className="text-muted">Realisasi</dt>
                                    <dd className="tabular-nums">{formatRupiah(target.realisasiAnggaran)}</dd>
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

                                <div className="flex flex-col gap-1">
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
