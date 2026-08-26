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
import { AlihStatusBAPenelitianContract } from "@/action/alih-status/ba-penelitian/contract";
import { actionEditAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.update";
import { actionCreateAlihStatusBAPenelitian } from "@/action/alih-status/ba-penelitian/action.create";

export function BAPenelitianFormModal({
    target,
    onClose,
}: {
    target: AlihStatusBAPenelitianContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusBAPenelitianContract.CreateDTO>({
        resolver: zodResolver(AlihStatusBAPenelitianContract.create),
        defaultValues: {
            masterId: target?.masterId ?? undefined,
            suratNomor: target?.suratNomor ?? "",
            suratTanggal: target?.suratTanggal ?? "",
            suratHal: target?.suratHal ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusBAPenelitianContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusBAPenelitian({ id: target!.id, ...values })
                : await actionCreateAlihStatusBAPenelitian(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "BA Penelitian Alih Status diperbarui" : "BA Penelitian Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan ba penelitian alih status", { description: error.message });
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
                                    {isEdit ? "Edit BA Penelitian Alih Status" : "Tambah BA Penelitian Alih Status"}
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
