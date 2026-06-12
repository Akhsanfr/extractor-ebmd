"use client";

import { useEffect, useState } from "react";
import { Select, Label, Description, ListBox, toast } from "@heroui/react";
import { getPerangkatDaerahAction } from "@/action/perangkatDaerah/action";
import { PerangkatDaerahContract } from "@/action/perangkatDaerah/contract";
import { syncBmdDataAction } from "@/action/bmd/bmd.action";

export default function SyncBmdPage() {
    const [perangkatDaerahList, setPerangkatDaerahList] = useState<PerangkatDaerahContract.SelectDTO[]>([]);
    const [selectedKodeLokasi, setSelectedKodeLokasi] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingPd, setIsFetchingPd] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resultMessage, setResultMessage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPerangkatDaerah() {
            try {
                const res = await getPerangkatDaerahAction();
                if (!res.success) throw res.error
            } catch (err: any) {
                toast.danger("Gagal memuat perangkat daerah. " + err.message)
            } finally {
                setIsFetchingPd(false);
            }
        }

        fetchPerangkatDaerah();
    }, []);

    const handleSyncData = async () => {
        if (!selectedKodeLokasi) {
            setError("Silakan pilih Perangkat Daerah terlebih dahulu.");
            return;
        }

        const selectedPd = perangkatDaerahList.find(pd => pd.kodeLokasi === selectedKodeLokasi);
        if (!selectedPd) return;

        setIsLoading(true);
        setError(null);
        setResultMessage(null);

        try {
            // Hanya panggil satu Server Action. Tarik, proses, dan simpan per batch akan berlaku di Server.
            const res = await syncBmdDataAction(selectedPd);
            if (!res.success) throw res.error
        } catch (err: any) {
            toast.danger("Gagal menyimpan data. " + err.message)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">Sinkronisasi Data BMD</h1>
            <p className="text-gray-600 mb-6">
                Pilih perangkat daerah dari senarai di bawah, kemudian klik butang untuk mengekstrak dan menyimpan data secara berperingkat (batch of 50).
            </p>

            <div className="space-y-6">
                <div className="max-w-md">
                    <Select
                        isDisabled={isFetchingPd || isLoading}
                        selectedKey={selectedKodeLokasi}
                        onSelectionChange={(key) => setSelectedKodeLokasi(key as string)}
                    >
                        <Label>Pilih Perangkat Daerah</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox items={perangkatDaerahList}>
                                {(pd) => (
                                    <ListBox.Item id={pd.kodeLokasi} textValue={pd.namaLokasi}>
                                        <Label>{pd.namaLokasi}</Label>
                                        <Description>Kode: {pd.kodeLokasi}</Description>
                                    </ListBox.Item>
                                )}
                            </ListBox>
                        </Select.Popover>
                    </Select>
                </div>

                <button
                    onClick={handleSyncData}
                    disabled={isLoading || !selectedKodeLokasi}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:bg-gray-400 transition-colors"
                >
                    {isLoading ? "Memproses Data Server..." : "Tarik & Upsert Data BMD"}
                </button>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {resultMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
                        ✅ <strong>Berhasil!</strong> {resultMessage}
                    </div>
                )}
            </div>
        </div>
    );
}