"use client";
import { useState } from "react";
import { Alert, Button, Chip, Input, Label, ListBox, Modal, Select, toast, type Key } from "@heroui/react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { actionEditRekon } from "@/action/rekon/action.update";
import { RekonContract } from "@/action/rekon/contract";
import { getSelisihStatus } from "./rekonStatus";
import {
    BULAN_LABEL,
    REKON_PIC_OPTIONS,
    REKON_TYPE_LABEL,
    formatRupiah,
    getErrorMessage,
    hitungSelisih,
    isRekonPic,
    nominalToInput,
    parseNominalInput,
    type RekonPic,
    type RekonRow,
} from "./rekonUtil";

type FieldName = "realisasiAnggaran" | "inputBMD";
type FieldErrors = Partial<Record<FieldName | "pic", string>>;

const NOMINAL_INVALID_MESSAGE = "Isi nominal yang valid, mis. 1500000 atau 1500000,50";
const PIC_NONE = "none";

// Mengubah realisasiAnggaran, inputBMD, dan pic. Bulan, tahun, jenis rekon, dan
// perangkat daerah tampil read-only dan tidak ikut dikirim ke server.
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
    const [realisasiValue, setRealisasiValue] = useState(() => nominalToInput(target.realisasiAnggaran));
    const [inputBmdValue, setInputBmdValue] = useState(() => nominalToInput(target.inputBMD));
    // PIC lama yang tidak ada di daftar dianggap belum ada PIC.
    const [pic, setPic] = useState<RekonPic | null>(() => (isRekonPic(target.pic) ? target.pic : null));
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
            toast.success("Data rekon berhasil diperbarui");
            onClose();
        },
        // Modal tetap terbuka dan isian pengguna tidak diubah saat gagal.
        onError: (error: unknown) => {
            toast.danger("Gagal menyimpan data rekon", { description: getErrorMessage(error) });
        },
    });

    // Pratinjau selisih mengikuti isian pengguna (hanya tampilan, tidak dikirim ke server).
    const realisasiPreview = parseNominalInput(realisasiValue);
    const inputBmdPreview = parseNominalInput(inputBmdValue);
    const previewSelisih =
        realisasiPreview === null || inputBmdPreview === null
            ? null
            : hitungSelisih({ realisasiAnggaran: realisasiPreview, inputBMD: inputBmdPreview });
    const previewStatus = previewSelisih ? getSelisihStatus(previewSelisih) : null;

    const clearFieldError = (name: FieldName | "pic") => {
        setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    };

    const submit = () => {
        if (mutation.isPending) return;

        const realisasiAnggaran = parseNominalInput(realisasiValue);
        const inputBMD = parseNominalInput(inputBmdValue);

        const errors: FieldErrors = {};
        if (realisasiAnggaran === null) errors.realisasiAnggaran = NOMINAL_INVALID_MESSAGE;
        if (inputBMD === null) errors.inputBMD = NOMINAL_INVALID_MESSAGE;
        if (realisasiAnggaran === null || inputBMD === null) {
            setFieldErrors(errors);
            return;
        }

        const parsed = RekonContract.edit.safeParse({ id: target.id, realisasiAnggaran, inputBMD, pic });
        if (!parsed.success) {
            const next: FieldErrors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0];
                if ((key === "realisasiAnggaran" || key === "inputBMD" || key === "pic") && !next[key]) {
                    next[key] = issue.message;
                }
            }
            // Jika error tidak terkait field tertentu, tampilkan di field pertama.
            if (Object.keys(next).length === 0) {
                next.realisasiAnggaran = parsed.error.issues[0]?.message ?? "Nominal tidak valid";
            }
            setFieldErrors(next);
            return;
        }

        setFieldErrors({});
        mutation.mutate(parsed.data);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !mutation.isPending) onClose();
    };

    const renderNominalField = ({
        name,
        label,
        value,
        onValueChange,
        autoFocus,
    }: {
        name: FieldName;
        label: string;
        value: string;
        onValueChange: (v: string) => void;
        autoFocus?: boolean;
    }) => {
        const error = fieldErrors[name];
        return (
            <div className="flex flex-col gap-1.5">
                <Label>{label}</Label>
                <Input
                    autoFocus={autoFocus}
                    inputMode="decimal"
                    placeholder="mis. 1500000,50"
                    value={value}
                    aria-invalid={error !== undefined}
                    disabled={mutation.isPending}
                    onChange={(e) => {
                        onValueChange(e.target.value);
                        clearFieldError(name);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                    }}
                />
                {error ? (
                    <p className="text-sm text-danger">{error}</p>
                ) : (
                    <p className="text-xs text-muted">
                        Gunakan koma untuk desimal. Titik diabaikan sebagai pemisah ribuan.
                    </p>
                )}
            </div>
        );
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
                                <Modal.Heading>Edit Rekon</Modal.Heading>
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

                                <Select
                                    value={pic ?? PIC_NONE}
                                    isDisabled={mutation.isPending}
                                    isInvalid={fieldErrors.pic !== undefined}
                                    onChange={(key: Key | null) => {
                                        if (!key) return;
                                        const next = String(key);
                                        setPic(isRekonPic(next) ? next : null);
                                        clearFieldError("pic");
                                    }}
                                >
                                    <Label>PIC</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            <ListBox.Item id={PIC_NONE} textValue="Belum ada PIC">
                                                Belum ada PIC
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                            {REKON_PIC_OPTIONS.map((name) => (
                                                <ListBox.Item key={name} id={name} textValue={name}>
                                                    {name}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                                {fieldErrors.pic && <p className="-mt-3 text-sm text-danger">{fieldErrors.pic}</p>}

                                {renderNominalField({
                                    name: "realisasiAnggaran",
                                    label: "Realisasi Anggaran (Rp)",
                                    value: realisasiValue,
                                    onValueChange: setRealisasiValue,
                                    autoFocus: true,
                                })}
                                {renderNominalField({
                                    name: "inputBMD",
                                    label: "Input BMD (Rp)",
                                    value: inputBmdValue,
                                    onValueChange: setInputBmdValue,
                                })}

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