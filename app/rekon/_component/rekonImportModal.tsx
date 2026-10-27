"use client";
import { useState } from "react";
import { Button, Chip, Label, Modal, Table, toast, useOverlayState } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Import } from "lucide-react";
import { actionImportRekon } from "@/action/rekon/action.import";
import { RekonContract } from "@/action/rekon/contract";
import { RekonFormat } from "@/action/rekon/format";
import ImportExcel from "@/component/import";
import { BULAN_LABEL, REKON_QUERY_KEY, formatRupiah, getErrorMessage } from "./rekonUtil";

const PREVIEW_LIMIT = 20;

export default function RekonImportModal({
    tahun,
    bulan,
}: {
    tahun: number | undefined;
    bulan: number;
}) {
    const queryClient = useQueryClient();
    const modal = useOverlayState();
    const [previewData, setPreviewData] = useState<RekonContract.ImportItemDTO>([]);
    const [file, setFile] = useState<File | null>(null);

    const resetImportState = () => {
        setPreviewData([]);
        setFile(null);
    };

    const handleModalOpenChange = (open: boolean) => {
        modal.setOpen(open);
        if (!open) resetImportState();
    };

    const importMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Berkas belum dipilih");
            if (tahun === undefined) throw new Error("Tahun belum ditentukan");
            const res = await actionImportRekon({ data: file, tahun, bulan });
            if (!res.success) throw res.error;
            return res;
        },
        onSuccess: async () => {
            toast.success(`${previewData.length} perangkat daerah berhasil diimport`);
            // Import bisa mengubah banyak baris sekaligus; refetch semua query rekon.
            await queryClient.invalidateQueries({ queryKey: REKON_QUERY_KEY });
            handleModalOpenChange(false);
        },
        onError: (error: unknown) => {
            toast.danger("Gagal import", { description: getErrorMessage(error) });
        },
    });

    const visibleRows = previewData.slice(0, PREVIEW_LIMIT);
    const hasPreview = previewData.length > 0;

    return (
        <>
            <Button
                variant="primary"
                className="shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
                isDisabled={tahun === undefined}
                onPress={() => handleModalOpenChange(true)}
            >
                <Import size={18} />
                Import
            </Button>
            <Modal isOpen={modal.isOpen} onOpenChange={handleModalOpenChange}>
                <Modal.Backdrop>
                    <Modal.Container size={hasPreview ? "cover" : "sm"}>
                        <Modal.Dialog>
                            <Modal.Header>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                                        <FileSpreadsheet size={18} />
                                    </span>
                                    <div>
                                        <Modal.Heading>Import realisasi anggaran</Modal.Heading>
                                        <p className="text-sm text-muted">
                                            {BULAN_LABEL[bulan - 1]} {tahun}
                                        </p>
                                    </div>
                                </div>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="flex flex-col gap-4">
                                    {!hasPreview ? (
                                        <div className="flex flex-col gap-1.5">
                                            <Label>File Excel</Label>
                                            <ImportExcel
                                                validation={RekonContract.importItem}
                                                format={RekonFormat.import}
                                                onSuccess={(rows, importedFile) => {
                                                    setPreviewData(rows);
                                                    setFile(importedFile);
                                                    toast.success(`${rows.length} baris siap diimport`);
                                                }}
                                                sheetName="rekon"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Label>Preview</Label>
                                                <Chip size="sm" variant="soft" color="accent">
                                                    <Chip.Label>
                                                        {visibleRows.length} dari {previewData.length} baris
                                                    </Chip.Label>
                                                </Chip>
                                            </div>
                                            <Table aria-label="Preview import rekon">
                                                <Table.ScrollContainer>
                                                    <Table.Content>
                                                        <Table.Header>
                                                            <Table.Column isRowHeader>Perangkat Daerah</Table.Column>
                                                            <Table.Column>
                                                                <div className="text-right">Aset Tetap</div>
                                                            </Table.Column>
                                                            <Table.Column>
                                                                <div className="text-right">Persediaan</div>
                                                            </Table.Column>
                                                            <Table.Column>
                                                                <div className="text-right">Pemeliharaan</div>
                                                            </Table.Column>
                                                        </Table.Header>
                                                        <Table.Body>
                                                            {visibleRows.map((row) => (
                                                                <Table.Row key={row.originalIndex}>
                                                                    <Table.Cell>
                                                                        <span className="font-medium">
                                                                            {row.perangkatDaerah}
                                                                        </span>
                                                                    </Table.Cell>
                                                                    <Table.Cell>
                                                                        <div className="text-right tabular-nums">
                                                                            {formatRupiah(row.asetTetap)}
                                                                        </div>
                                                                    </Table.Cell>
                                                                    <Table.Cell>
                                                                        <div className="text-right tabular-nums">
                                                                            {formatRupiah(row.persediaan)}
                                                                        </div>
                                                                    </Table.Cell>
                                                                    <Table.Cell>
                                                                        <div className="text-right tabular-nums">
                                                                            {formatRupiah(row.pemeliharaan)}
                                                                        </div>
                                                                    </Table.Cell>
                                                                </Table.Row>
                                                            ))}
                                                        </Table.Body>
                                                    </Table.Content>
                                                </Table.ScrollContainer>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    variant="ghost"
                                    isDisabled={importMutation.isPending}
                                    onPress={() => handleModalOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                {hasPreview && (
                                    <Button
                                        variant="secondary"
                                        isDisabled={importMutation.isPending}
                                        onPress={resetImportState}
                                    >
                                        Ulangi
                                    </Button>
                                )}
                                <Button
                                    isDisabled={importMutation.isPending || !hasPreview}
                                    onPress={() => importMutation.mutate()}
                                >
                                    {importMutation.isPending ? "Menyimpan..." : "Simpan"}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}