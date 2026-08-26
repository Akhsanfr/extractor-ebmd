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
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Card,
    DatePicker,
    DateField,
    Calendar,
} from "@heroui/react";
import { AlihStatusSpkmbContract } from "@/action/alih-status/spkmb/contract";
import { actionEditAlihStatusSpkmb } from "@/action/alih-status/spkmb/action.update";
import { actionCreateAlihStatusSpkmb } from "@/action/alih-status/spkmb/action.create";
import { useState, useEffect } from "react";
import { Edit, Trash } from "lucide-react";
import { actionDeleteAlihStatusSpkmb } from "@/action/alih-status/spkmb/action.delete";
import { actionGetAlihStatusSpkmbByMasterId } from "@/action/alih-status/spkmb/action.read";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";

export default function AlihStatusSpkmb({ masterId }: { masterId: number }) {
    const [data, setData] = useState<AlihStatusSpkmbContract.SelectDTO | null>(null);
    const [formTarget, setFormTarget] = useState<
        AlihStatusSpkmbContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit
    const getListData = async () => {
        try {
            const res = await actionGetAlihStatusSpkmbByMasterId(masterId);
            if (!res.success) {
                throw res.error;
            }
            setData(res.data);
        } catch (error: any) {
            toast.danger("Gagal mendapatkan spkmb alih status", { description: error.message });
        }
    };

    useEffect(() => {
        getListData();
    }, []);

    return (
        <Card>
            <Card.Header>
                <Card.Title>SPKMB Alih Status</Card.Title>
                <Button onPress={() => setFormTarget(null)}>
                    Tambah Data SPKMB
                </Button>
            </Card.Header>
            <Card.Content>
                {data !== null && (
                    <ul>
                        <li>Tanggal SPKMB : {data.suratTanggal}</li>
                        <li>Nomor SPKMB : {data.suratNomor}</li>
                        <li>Hal SPKMB : {data.suratHal}</li>
                        <li>Nama Pengguna Barang : {data.penggunaBarangNama}</li>
                        <li>NIP Pengguna Barang : {data.penggunaBarangNIP}</li>
                        <li>Pangkat Pengguna Barang : {data.penggunaBarangPangkat}</li>
                    </ul>
                )}

                {formTarget !== undefined && (
                    <SpkmbFormModal
                        masterId={masterId}
                        target={formTarget}
                        onClose={() => {
                            setFormTarget(undefined);
                            getListData();
                        }}
                    />
                )}
            </Card.Content>
        </Card>
    );
}

function SpkmbFormModal({
    masterId,
    target,
    onClose,
}: {
    masterId: number;
    target: AlihStatusSpkmbContract.SelectDTO | null; // null = mode create
    onClose: () => void;
}) {
    const isEdit = target !== null;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AlihStatusSpkmbContract.CreateDTO>({
        resolver: zodResolver(AlihStatusSpkmbContract.create),
        defaultValues: {
            suratTanggal: target?.suratTanggal ?? today(getLocalTimeZone()).toString(),
            masterId: masterId,
            suratNomor: target?.suratNomor ?? "",
            suratHal: target?.suratHal ?? "",
            penggunaBarangNama: target?.penggunaBarangNama ?? "",
            penggunaBarangNIP: target?.penggunaBarangNIP ?? "",
            penggunaBarangPangkat: target?.penggunaBarangPangkat ?? "",
        },
    });

    const onSubmit = async (values: AlihStatusSpkmbContract.CreateDTO) => {
        try {
            const result = isEdit
                ? await actionEditAlihStatusSpkmb({ id: target!.id, ...values })
                : await actionCreateAlihStatusSpkmb(values);

            if (!result.success) {
                throw result.error;
            }
            toast.success(
                isEdit ? "SPKMB Alih Status diperbarui" : "SPKMB Alih Status ditambahkan",
                { description: result.message },
            );
            onClose();
        } catch (error: any) {
            console.error("fail", error);
            toast.danger("Gagal menyimpan spkmb alih status", { description: error.message });
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
                                    {isEdit ? "Edit SPKMB Alih Status" : "Tambah SPKMB Alih Status"}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="grid grid-cols-2 gap-4">
                                <Controller
                                    control={control}
                                    name="suratTanggal"
                                    render={({ field, fieldState }) => (


                                        <DatePicker
                                            value={field.value ? (parseDate(field.value) as any) : undefined}
                                            onChange={(date) => field.onChange(date?.toString() ?? "")}
                                            onBlur={field.onBlur}
                                            isInvalid={fieldState.invalid}
                                        >
                                            <Label>Tanggal Surat</Label>
                                            <DateField.Group fullWidth>
                                                <DateField.Input>{(segment) => <DateField.Segment segment={(() => {
                                                    console.log("segmen", segment);
                                                    return segment
                                                })()} />}</DateField.Input>
                                                <DateField.Suffix>
                                                    <DatePicker.Trigger>
                                                        <DatePicker.TriggerIndicator />
                                                    </DatePicker.Trigger>
                                                </DateField.Suffix>
                                            </DateField.Group>
                                            <DatePicker.Popover>
                                                <Calendar aria-label="Event date">
                                                    <Calendar.Header>
                                                        <Calendar.YearPickerTrigger>
                                                            <Calendar.YearPickerTriggerHeading />
                                                            <Calendar.YearPickerTriggerIndicator />
                                                        </Calendar.YearPickerTrigger>
                                                        <Calendar.NavButton slot="previous" />
                                                        <Calendar.NavButton slot="next" />
                                                    </Calendar.Header>
                                                    <Calendar.Grid>
                                                        <Calendar.GridHeader>
                                                            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                                                        </Calendar.GridHeader>
                                                        <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                                                    </Calendar.Grid>
                                                    <Calendar.YearPickerGrid>
                                                        <Calendar.YearPickerGridBody>
                                                            {({ year }) => <Calendar.YearPickerCell year={year} />}
                                                        </Calendar.YearPickerGridBody>
                                                    </Calendar.YearPickerGrid>
                                                </Calendar>
                                            </DatePicker.Popover>
                                        </DatePicker>

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
                                    name="suratHal"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-2">
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
                                <Controller
                                    name="penggunaBarangNama"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField className="col-span-2">
                                            <Label>Nama Pengguna Barang</Label>
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
                                        <TextField className="col-span-2">
                                            <Label>NIP Pengguna Barang</Label>
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
                                        <TextField className="col-span-2">
                                            <Label>Pangkat Pengguna Barang</Label>
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
