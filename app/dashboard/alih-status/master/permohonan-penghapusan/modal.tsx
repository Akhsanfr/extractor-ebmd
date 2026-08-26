"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Modal,
    Button,
    Input,
    toast,
    TextField,
    Label,
    ErrorMessage,
} from "@heroui/react";
import { AlihStatusPermohonanPenghapusanContract } from "@/action/alih-status/permohonan-penghapusan/contract";
import { actionEditAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.update";
import { actionCreateAlihStatusPermohonanPenghapusan } from "@/action/alih-status/permohonan-penghapusan/action.create";

export function PermohonanPenghapusanFormModal({
    masterId,
    target,
    onClose,
}: {
    masterId: number;
    target: AlihStatusPermohonanPenghapusanContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusPermohonanPenghapusanContract.CreateDTO>({
        resolver: zodResolver(AlihStatusPermohonanPenghapusanContract.create),
        defaultValues: {
            masterId,
            suratNomor: target?.suratNomor ?? "",
            suratTanggal: target?.suratTanggal ?? "",
            suratHal: target?.suratHal ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusPermohonanPenghapusanContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusPermohonanPenghapusan({ id: target!.id, ...values })
                : await actionCreateAlihStatusPermohonanPenghapusan(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "Permohonan Penghapusan Alih Status diperbarui" : "Permohonan Penghapusan Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan permohonan penghapusan alih status", { description: error.message });
        }
    };
    const onError = (errors: any) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(errors) });
    };

    return (
        <Modal isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
                            <Modal.CloseTrigger onPress={onClose} />
                            <Modal.Header>
                                <Modal.Heading>
                                    {isEdit ? "Edit Permohonan Penghapusan Alih Status" : "Tambah Permohonan Penghapusan Alih Status"}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4">

                                <Controller
                                    name="suratNomor"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Nomor Surat</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.suratNomor) && <>{errors.suratNomor?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="suratTanggal"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Tanggal Surat</Label>
                                            <Input
                                                type="date"
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.suratTanggal) && <>{errors.suratTanggal?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="suratHal"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Hal Surat</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.suratHal) && <>{errors.suratHal?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onPress={onClose}>
                                    Batal
                                </Button>
                                <Button type="submit">
                                    Simpan
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
