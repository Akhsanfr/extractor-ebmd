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
import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract";
import { actionEditAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.update";
import { actionCreateAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.create";
import { actionGetDetailAlihStatusPersetujuanBupati } from "@/action/alih-status/persetujuan-bupati/action.read";

export default function AlihStatusPersetujuanBupati({ groupId, onLoad, persetujuanBupati, onGenerate }: {
    groupId: number, onLoad: (data: AlihStatusPersetujuanBupatiContract.SelectDTO) => void, persetujuanBupati: AlihStatusPersetujuanBupatiContract.SelectDTO | null,
    onGenerate: () => void
}) {
    const [formTarget, setFormTarget] = useState<
        AlihStatusPersetujuanBupatiContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    const getData = async () => {
        try {
            const res = await actionGetDetailAlihStatusPersetujuanBupati(groupId);
            if (!res.success) {
                throw res.error;
            }
            onLoad(res.data)
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
                    <Card.Title>Surat Persetujuan Bupati Alih Status</Card.Title>
                    <Button onPress={() => setFormTarget(null)}>
                        Tambah Surat Persetujuan Bupati Alih Status
                    </Button>
                </Card.Header>
                <Card.Content>
                    {persetujuanBupati !== null && (
                        <ul>
                            <li>Nomor Surat : {persetujuanBupati.suratNomor}</li>
                            <li>Tanggal Surat : {persetujuanBupati.suratTanggal}</li>
                            <li>Hal Surat : {persetujuanBupati.suratHal}</li>
                        </ul>
                    )}
                    <Button onPress={onGenerate}>Cetak Dokumen</Button>


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
    target: AlihStatusPersetujuanBupatiContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusPersetujuanBupatiContract.CreateDTO>({
        resolver: zodResolver(AlihStatusPersetujuanBupatiContract.create),
        defaultValues: {
            groupId,
            suratNomor: target?.suratNomor ?? "",
            suratTanggal: target?.suratTanggal ?? "",
            suratHal: target?.suratHal ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusPersetujuanBupatiContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusPersetujuanBupati({ id: target!.id, ...values })
                : await actionCreateAlihStatusPersetujuanBupati(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "Persetujuan Bupati Alih Status diperbarui" : "Persetujuan Bupati Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan persetujuan bupati alih status", { description: error.message });
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
                                {/* TODO: ganti jadi Select yang mengambil daftar dari action list terkait, ini sementara input angka ID */}
                                <Controller
                                    name="groupId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField>
                                            <Label>ID Group</Label>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                            />
                                            <ErrorMessage>{Boolean(errors.groupId) && <>{errors.groupId?.message}</>}
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
