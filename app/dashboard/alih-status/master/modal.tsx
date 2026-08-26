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
import { AlihStatusMasterContract } from "@/action/alih-status/master/contract";
import { actionEditAlihStatusMaster } from "@/action/alih-status/master/action.update";
import { actionCreateAlihStatusMaster } from "@/action/alih-status/master/action.create";

export function ContentFormModal({
    target,
    onClose
}: {
    target: AlihStatusMasterContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        getValues,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusMasterContract.CreateDTO>({
        resolver: zodResolver(AlihStatusMasterContract.create),
        defaultValues: {
            perangkatDaerahAsal: target?.perangkatDaerahAsal ?? "",
            penggunaBarangNama: target?.penggunaBarangNama ?? "",
            penggunaBarangNIP: target?.penggunaBarangNIP ?? "",
            penggunaBarangPangkat: target?.penggunaBarangPangkat ?? "",
            pengurusBarangNama: target?.pengurusBarangNama ?? "",
        },
    });
    console.log(getValues())
    const onSubmit = (async (values: AlihStatusMasterContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusMaster({ id: target!.id, ...values })
                : await actionCreateAlihStatusMaster(values);

            if (!result.success) {
                throw result.error
            }
            toast.success(
                isEdit ? "Content diperbarui" : "Content ditambahkan", {
                description: result.message,
            });
            onClose()
        } catch (error: any) {
            console.error("fail", error)
            toast.danger("Gagal memperbarui konten", { description: error.message });
        }
    });
    const onError = (errors: any) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(errors) });
    }
    return (
        <Modal isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
                            <Modal.CloseTrigger onPress={onClose} />
                            <Modal.Header>
                                <Modal.Heading>
                                    {isEdit ? "Edit Content" : "Tambah Content"}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4">
                                <Controller
                                    name="perangkatDaerahAsal"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Perangkat Daerah Asal</Label>
                                            <Input
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.perangkatDaerahAsal) && <>{errors.perangkatDaerahAsal?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="penggunaBarangNama"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Pengguna Barang</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.penggunaBarangNama) && <>{errors.penggunaBarangNama?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="penggunaBarangNIP"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>NIP</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.penggunaBarangNIP) && <>{errors.penggunaBarangNIP?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="penggunaBarangPangkat"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Pangkat</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.penggunaBarangPangkat) && <>{errors.penggunaBarangPangkat?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                                <Controller
                                    name="pengurusBarangNama"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Pengurus Barang</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.pengurusBarangNama) && <>{errors.pengurusBarangNama?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onPress={onClose}>
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                >
                                    Simpan
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal >
    );
}