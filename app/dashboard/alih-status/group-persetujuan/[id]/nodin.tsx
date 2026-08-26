"use client";

import { useState, useEffect } from "react";
import {
    Card,
} from "@heroui/react";
import { actionGetListAlihStatusNodin } from "@/action/alih-status/nodin/action.read";
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
import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract";
import { actionEditAlihStatusNodin } from "@/action/alih-status/nodin/action.update";
import { actionCreateAlihStatusNodin } from "@/action/alih-status/nodin/action.create";

export default function AlihStatusNodin({ groupId, nodin, setNodin }: { groupId: number, nodin: AlihStatusNodinContract.SelectDTO | null, setNodin: (n: AlihStatusNodinContract.SelectDTO | null) => void }) {

    const [formTarget, setFormTarget] = useState<
        AlihStatusNodinContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const getData = async () => {
        try {
            const res = await actionGetListAlihStatusNodin(groupId);
            if (!res.success) {
                throw res.error;
            }
            setNodin(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan nota dinas alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getData();
    }, []);

    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Nota Dinas Alih Status</Card.Title>
                    <Button onPress={() => setFormTarget(null)}>
                        Tambah Nota Dinas Alih Status
                    </Button>
                </Card.Header>
                <Card.Content>
                    {nodin !== null && (
                        <ul>
                            <li>Nomor Surat : {nodin.suratNomor}</li>
                            <li>Tanggal Surat : {nodin.suratTanggal}</li>
                            <li>Hal Surat : {nodin.suratHal}</li>
                        </ul>
                    )}

                    {formTarget !== undefined && (
                        <PermohonanFormModal
                            groupId={groupId}
                            target={formTarget}
                            onClose={() => {
                                setFormTarget(undefined);
                                getData();
                            }}
                        />
                    )}
                </Card.Content>
            </Card>
        </>

    );
}


function PermohonanFormModal({
    groupId,
    target,
    onClose,
}: {
    groupId: number;
    target: AlihStatusNodinContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusNodinContract.CreateDTO>({
        resolver: zodResolver(AlihStatusNodinContract.create),
        defaultValues: {
            groupId,
            suratNomor: target?.suratNomor ?? "",
            suratTanggal: target?.suratTanggal ?? "",
            suratHal: target?.suratHal ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusNodinContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusNodin({ id: target!.id, ...values })
                : await actionCreateAlihStatusNodin(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "Nota Dinas Alih Status diperbarui" : "Nota Dinas Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan nota dinas alih status", { description: error.message });
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
                                    {isEdit ? "Edit Nota Dinas Alih Status" : "Tambah Nota Dinas Alih Status"}
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
