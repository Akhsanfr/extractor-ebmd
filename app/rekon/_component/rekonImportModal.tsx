"use client";
import { useState } from "react";
import { Button, Label, Modal, Table, toast, useOverlayState } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Import } from "lucide-react";
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

    return (
        <>
            <Button
                variant="secondary"
                isDisabled={tahun === undefined}
                onPress={() => handleModalOpenChange(true)}
            >
                <Import />
                Import
            </Button>
            <Modal isOpen={modal.isOpen} onOpenChange={handleModalOpenChange}>
                <Modal.Backdrop>
                    <Modal.Container size={previewData.length > 0 ? "cover" : "sm"}>
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>
                                    Import realisasi anggaran — {BULAN_LABEL[bulan - 1]} {tahun}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="flex flex-col gap-4">
                                    {previewData.length === 0 ? (
                                        <div className="flex flex-col gap-1">
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
                                        <div className="flex flex-col gap-1">
                                            <Label>
                                                Preview ({visibleRows.length} dari {previewData.length} baris)
                                            </Label>
                                            <Table aria-label="Preview import rekon">
                                                <Table.ScrollContainer>
                                                    <Table.Content>
                                                        <Table.Header>
                                                            <Table.Column isRowHeader>Perangkat Daerah</Table.Column>
                                                            <Table.Column>Aset Tetap</Table.Column>
                                                            <Table.Column>Persediaan</Table.Column>
                                                            <Table.Column>Pemeliharaan</Table.Column>
                                                        </Table.Header>
                                                        <Table.Body>
                                                            {visibleRows.map((row) => (
                                                                <Table.Row key={row.originalIndex}>
                                                                    <Table.Cell>{row.perangkatDaerah}</Table.Cell>
                                                                    <Table.Cell>{formatRupiah(row.asetTetap)}</Table.Cell>
                                                                    <Table.Cell>{formatRupiah(row.persediaan)}</Table.Cell>
                                                                    <Table.Cell>{formatRupiah(row.pemeliharaan)}</Table.Cell>
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
                                {previewData.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        isDisabled={importMutation.isPending}
                                        onPress={resetImportState}
                                    >
                                        Ulangi
                                    </Button>
                                )}
                                <Button
                                    isDisabled={importMutation.isPending || previewData.length === 0}
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
