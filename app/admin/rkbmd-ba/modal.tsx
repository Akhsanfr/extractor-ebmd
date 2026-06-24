"use client";

import { RkbmdBaContract } from "@/action/rkbmdBa/rkbmd-ba-contract";
import { Perekon } from "./page";
import { useEffect, useState } from "react";
import { updateRkbmdBaAction } from "@/action/rkbmdBa/rkbmd-ba-action";
import { Button, Calendar, Checkbox, DateField, DatePicker, DateValue, Input, Label, Modal, TextField } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { X } from "lucide-react";


export default function ModalBA({
    row,
    perekon,
    onClose,
    onSuccess,
}: {
    row: RkbmdBaContract.SelectDTO | null;
    perekon: Perekon;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const isOpen = !!row;

    const [pengantar, setPengantar] = useState(false);
    const [pengantarTanggal, setPengantarTanggal] = useState<DateValue | null>(null);
    const [pengantarNomor, setPengantarNomor] = useState("");
    const [pengadaan, setPengadaan] = useState(false);
    const [pemeliharaan, setPemeliharaan] = useState(false);
    const [namaPeserta, setNamaPeserta] = useState("");
    const [nipPeserta, setNipPeserta] = useState("");
    const [jabatanPeserta, setJabatanPeserta] = useState("");
    const [tanggalPerbaikan, setTanggalPerbaikan] =
        useState<DateValue | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!row) return;
        console.log("tgl", row.tanggalPerbaikan)
        setPengantar(row.pengantar);
        setPengantarTanggal(row.pengantarTanggal ? parseDate(row.pengantarTanggal.toISOString().slice(0, 10)) as unknown as DateValue : null);
        setPengantarNomor(row.pengantarNomor ?? "");
        setPengadaan(row.pengadaan);
        setPemeliharaan(row.pemeliharaan);
        setNamaPeserta(row.namaPeserta ?? "");
        setNipPeserta(row.nipPeserta ?? "");
        setJabatanPeserta(row.jabatanPeserta ?? "");
        setTanggalPerbaikan(
            row.tanggalPerbaikan
                ? parseDate(row.tanggalPerbaikan.toISOString().slice(0, 10)) as unknown as DateValue
                : null
        );
        setError("");
    }, [row]);

    const handleSave = async () => {
        if (!row) return;
        setSaving(true);
        setError("");
        const result = await updateRkbmdBaAction({
            perangkatDaerahId: row.perangkatDaerahId,
            pengantar,
            pengadaan,
            pemeliharaan,
            namaPeserta: namaPeserta.trim() || null,
            nipPeserta: nipPeserta.trim() || null,
            jabatanPeserta: jabatanPeserta.trim() || null,
            tanggalPerbaikan: tanggalPerbaikan
                ? new Date(tanggalPerbaikan.toString())
                : null,
            pengantarTanggal: pengantarTanggal
                ? new Date(pengantarTanggal.toString())
                : null,
            pengantarNomor: pengantarNomor.trim() || null,
            updatedBy: `${perekon.nama} (${perekon.nip})`,
        });
        if (!result.success) {
            alert(`Gagal menyimpan data ${result.error?.message}`)
            return;
        }
        onSuccess()
        setSaving(false);
    };

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger onPress={onClose} />
                        <Modal.Header>
                            <Modal.Heading>Edit BA — {row?.perangkatDaerah}</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-4 p-4">
                            {/* Kelengkapan BA */}
                            <div>
                                <p className="mb-2 text-xs font-medium text-default-500 uppercase tracking-wider">
                                    Kelengkapan BA
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Checkbox id="pengantar" isSelected={pengantar} onChange={setPengantar}>
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Content>
                                            <Label htmlFor="pengantar">Pengantar</Label>
                                        </Checkbox.Content>
                                    </Checkbox>
                                    <Checkbox id="pengadaan" isSelected={pengadaan} onChange={setPengadaan}>
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Content>
                                            <Label htmlFor="pengadaan">Pengadaan</Label>
                                        </Checkbox.Content>
                                    </Checkbox>
                                    <Checkbox id="pemeliharaan" isSelected={pemeliharaan} onChange={setPemeliharaan}>
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Content>
                                            <Label htmlFor="pemeliharaan">Pemeliharaan</Label>
                                        </Checkbox.Content>
                                    </Checkbox>
                                    <TextField name="pengantarNomor" value={pengantarNomor} onChange={setPengantarNomor}>
                                        <Label>Nomor Pengantar</Label>
                                        <Input placeholder="Nomor pengantar" />
                                    </TextField>
                                    <DatePicker
                                        name="pengantarTanggal"
                                        value={pengantarTanggal}
                                        onChange={setPengantarTanggal}
                                    >
                                        <Label>Pengantar Tanggal</Label>
                                        <DateField.Group fullWidth>
                                            <DateField.Input>
                                                {(segment) => <DateField.Segment segment={segment} />}
                                            </DateField.Input>
                                            <DateField.Suffix>
                                                <DatePicker.Trigger>
                                                    <DatePicker.TriggerIndicator />
                                                </DatePicker.Trigger>
                                                <Button onPress={() => setPengantarTanggal(null)}>
                                                    <X />
                                                </Button>
                                            </DateField.Suffix>
                                        </DateField.Group>
                                        <DatePicker.Popover>
                                            <Calendar aria-label="Tanggal perbaikan">
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
                                                    <Calendar.GridBody>
                                                        {(date) => <Calendar.Cell date={date} />}
                                                    </Calendar.GridBody>
                                                </Calendar.Grid>
                                                <Calendar.YearPickerGrid>
                                                    <Calendar.YearPickerGridBody>
                                                        {({ year }) => <Calendar.YearPickerCell year={year} />}
                                                    </Calendar.YearPickerGridBody>
                                                </Calendar.YearPickerGrid>
                                            </Calendar>
                                        </DatePicker.Popover>
                                    </DatePicker>
                                </div>
                            </div>

                            {/* Tanggal Perbaikan */}
                            <DatePicker
                                name="tanggalPerbaikan"
                                value={tanggalPerbaikan}
                                onChange={setTanggalPerbaikan}
                            >
                                <Label>Tanggal Perbaikan</Label>
                                <DateField.Group fullWidth>
                                    <DateField.Input>
                                        {(segment) => <DateField.Segment segment={segment} />}
                                    </DateField.Input>
                                    <DateField.Suffix>
                                        <DatePicker.Trigger>
                                            <DatePicker.TriggerIndicator />
                                        </DatePicker.Trigger>
                                        <Button onPress={() => setTanggalPerbaikan(null)}>
                                            <X />
                                        </Button>
                                    </DateField.Suffix>
                                </DateField.Group>
                                <DatePicker.Popover>
                                    <Calendar aria-label="Tanggal perbaikan">
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
                                            <Calendar.GridBody>
                                                {(date) => <Calendar.Cell date={date} />}
                                            </Calendar.GridBody>
                                        </Calendar.Grid>
                                        <Calendar.YearPickerGrid>
                                            <Calendar.YearPickerGridBody>
                                                {({ year }) => <Calendar.YearPickerCell year={year} />}
                                            </Calendar.YearPickerGridBody>
                                        </Calendar.YearPickerGrid>
                                    </Calendar>
                                </DatePicker.Popover>
                            </DatePicker>

                            {/* Peserta */}
                            <div className="flex flex-col gap-3">
                                <p className="text-xs font-medium text-default-500 uppercase tracking-wider">
                                    Data Peserta
                                </p>
                                <TextField name="namaPeserta" value={namaPeserta} onChange={setNamaPeserta}>
                                    <Label>Nama Peserta</Label>
                                    <Input placeholder="Nama lengkap peserta" />
                                </TextField>
                                <TextField name="nipPeserta" value={nipPeserta} onChange={setNipPeserta}>
                                    <Label>NIP Peserta</Label>
                                    <Input placeholder="NIP peserta" />
                                </TextField>
                                <TextField name="jabatanPeserta" value={jabatanPeserta} onChange={setJabatanPeserta}>
                                    <Label>Jabatan Peserta</Label>
                                    <Input placeholder="Jabatan peserta" />
                                </TextField>
                            </div>

                            {/* Perekon info */}
                            <div className="rounded-lg bg-default-50 px-3 py-2 text-xs text-default-400">
                                Diperbarui oleh:{" "}
                                <span className="font-medium text-default-600">{perekon.nama}</span>{" "}
                                ({perekon.nip})
                            </div>

                            {error && <p className="text-sm text-danger">{error}</p>}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="secondary" onPress={onClose} isDisabled={saving}>
                                Batal
                            </Button>
                            <Button variant="primary" onPress={handleSave} isPending={saving}>
                                Simpan
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}