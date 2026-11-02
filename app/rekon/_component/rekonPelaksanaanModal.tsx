"use client";
import { useState } from "react";
import { Button, DateField, DateRangePicker, Label, Modal, RangeCalendar } from "@heroui/react";
import { Download } from "lucide-react";
import type { RentangTanggal } from "@/lib/generateDoc/rekon/laporanHasilRekon";

type Props = {
    isPending: boolean;
    onClose: () => void;
    onSubmit: (rentang: RentangTanggal) => void;
};

export default function RekonPelaksanaanModal({ isPending, onClose, onSubmit }: Props) {
    const [rentang, setRentang] = useState<RentangTanggal | null>(null);

    return (
        <Modal.Backdrop isOpen onOpenChange={(open) => !open && !isPending && onClose()}>
            <Modal.Container>
                <Modal.Dialog className="sm:max-w-md">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                        <Modal.Heading>Tanggal Pelaksanaan Rekon</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body className="p-1">
                        <DateRangePicker
                            className="w-full"
                            onChange={(range) =>
                                setRentang(range ? { start: range.start, end: range.end } : null)
                            }
                        >
                            <Label>Tanggal pelaksanaan</Label>
                            <DateField.Group fullWidth>
                                <DateField.Input slot="start">
                                    {(segment) => <DateField.Segment segment={segment} />}
                                </DateField.Input>
                                <DateRangePicker.RangeSeparator />
                                <DateField.Input slot="end">
                                    {(segment) => <DateField.Segment segment={segment} />}
                                </DateField.Input>
                                <DateField.Suffix>
                                    <DateRangePicker.Trigger>
                                        <DateRangePicker.TriggerIndicator />
                                    </DateRangePicker.Trigger>
                                </DateField.Suffix>
                            </DateField.Group>
                            <DateRangePicker.Popover>
                                <RangeCalendar aria-label="Tanggal pelaksanaan">
                                    <RangeCalendar.Header>
                                        <RangeCalendar.NavButton slot="previous" />
                                        <RangeCalendar.Heading />
                                        <RangeCalendar.NavButton slot="next" />
                                    </RangeCalendar.Header>
                                    <RangeCalendar.Grid>
                                        <RangeCalendar.GridHeader>
                                            {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                                        </RangeCalendar.GridHeader>
                                        <RangeCalendar.GridBody>
                                            {(date) => <RangeCalendar.Cell date={date} />}
                                        </RangeCalendar.GridBody>
                                    </RangeCalendar.Grid>
                                </RangeCalendar>
                            </DateRangePicker.Popover>
                        </DateRangePicker>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onPress={onClose} isDisabled={isPending}>
                            Batal
                        </Button>
                        <Button
                            isDisabled={!rentang}
                            isPending={isPending}
                            onPress={() => rentang && onSubmit(rentang)}
                        >
                            <Download size={16} />
                            Unduh
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Backdrop>
    );
}