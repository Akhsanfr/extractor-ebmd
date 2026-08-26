"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    toast,
    Modal,
    Input,
    TextField,
    Label,
    ErrorMessage,
    Card,
} from "@heroui/react";
import { Edit, Trash } from "lucide-react";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { actionDeleteAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.delete";
import { actionGetListAlihStatusPermohonanByMasterId } from "@/action/alih-status/permohonan/action.read";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { actionEditAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.update";
import { actionCreateAlihStatusPermohonan } from "@/action/alih-status/permohonan/action.create";

export default function AlihStatusPermohonan({ masterId }: { masterId: number }) {
    const [data, setData] = useState<AlihStatusPermohonanContract.SelectDTO | null>(null);
    const [formTarget, setFormTarget] = useState<
        AlihStatusPermohonanContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const getData = async () => {
        try {
            const res = await actionGetListAlihStatusPermohonanByMasterId(masterId);
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan permohonan alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getData();
    }, []);

    return (
        <Card>
            <Card.Header>
                <Card.Title>Permohonan Alih Status</Card.Title>
                <Button onPress={() => setFormTarget(null)}>
                    Tambah Data Permohonan
                </Button>
            </Card.Header>
            <Card.Content>
                {data !== null && (
                    <ul>
                        <li>Alasan : {data.alasan}</li>
                        <li>Nomor Surat : {data.suratNomor}</li>
                        <li>Tanggal Surat : {data.suratTanggal}</li>
                        <li>Hal Surat : {data.suratHal}</li>
                    </ul>
                )}

                {formTarget !== undefined && (
                    <PermohonanFormModal
                        masterId={masterId}
                        target={formTarget}
                        onClose={() => {
                            setFormTarget(undefined);
                            getData();
                        }}
                    />
                )}
            </Card.Content>
        </Card>
    );
}


function PermohonanFormModal({
    masterId,
    target,
    onClose,
}: {
    masterId: number;
    target: AlihStatusPermohonanContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusPermohonanContract.CreateDTO>({
        resolver: zodResolver(AlihStatusPermohonanContract.create),
        defaultValues: {
            masterId: masterId,
            alasan: target?.alasan ?? "",
            suratNomor: target?.suratNomor ?? "",
            suratTanggal: target?.suratTanggal ?? "",
            suratHal: target?.suratHal ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusPermohonanContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusPermohonan({ id: target!.id, ...values })
                : await actionCreateAlihStatusPermohonan(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "Permohonan Alih Status diperbarui" : "Permohonan Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan permohonan alih status", { description: error.message });
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
                                    {isEdit ? "Edit Permohonan Alih Status" : "Tambah Permohonan Alih Status"}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4">
                                <Controller
                                    name="alasan"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>Alasan</Label>
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.alasan) && <>{errors.alasan?.message}</>}
                                            </ErrorMessage>
                                        </TextField>
                                    )}
                                />
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
