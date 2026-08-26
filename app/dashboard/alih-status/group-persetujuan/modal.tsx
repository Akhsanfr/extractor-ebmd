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
import { AlihStatusGroupPersetujuanContract } from "@/action/alih-status/groupPersetujuan/contract";
import { actionEditAlihStatusGroupPersetujuan } from "@/action/alih-status/groupPersetujuan/action.update";
import { actionCreateAlihStatusGroupPersetujuan } from "@/action/alih-status/groupPersetujuan/action.create";

export function GroupFormModal({
    target,
    onClose,
}: {
    target: AlihStatusGroupPersetujuanContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusGroupPersetujuanContract.CreateDTO>({
        resolver: zodResolver(AlihStatusGroupPersetujuanContract.create),
        defaultValues: {
            nama: target?.nama ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusGroupPersetujuanContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusGroupPersetujuan({ id: target!.id, ...values })
                : await actionCreateAlihStatusGroupPersetujuan(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "Group Alih Status diperbarui" : "Group Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan group alih status", { description: error.message });
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
                                    {isEdit ? "Edit Group Alih Status" : "Tambah Group Alih Status"}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4">
                                <Controller
                                    name="nama"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Nama Group</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.nama) && <>{errors.nama?.message}</>}
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
