"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Chip, Description, Dropdown, Input, Label, Modal, Popover, Spinner, Table, TextField } from "@heroui/react";
import { getRkbmdBaAction, updateRkbmdBaAction } from "@/action/rkbmdBa/rkbmd-ba-action";
import { RkbmdBaContract } from "@/action/rkbmdBa/rkbmd-ba-contract";
import { Check, FileText, Minus, Pen, Printer, RefreshCw, ScrollText } from "lucide-react";
import { generateBaDesk } from "@/lib/rkbmd/generateBaDesk";
import ModalBA from "./modal";
import { exportBADesk } from "@/lib/rkbmd/exportBADesk";
import { ListPemeliharaan, ListPengadaan } from "@/types/rkbmd";
import { loadStorage, PEMELIHARAAN_STORAGE_KEY, PENGADAAN_STORAGE_KEY } from "@/lib/bmd-storage";
import { generateSuratHasilPenelaahan } from "@/lib/rkbmd/generateSuratHasilPenelaahan";

export interface Perekon {
    nama: string;
    nip: string;
}

const PBMD_PASSWORD = "pbmd";

function statusChip(row: RkbmdBaContract.SelectDTO) {
    const aktif = [row.pengantar, row.pengadaan, row.pemeliharaan].filter(Boolean).length;
    if (aktif === 0) return <Chip size="sm" color="default">Belum</Chip>;
    if (aktif === 3) return <Chip size="sm" color="success">Lengkap</Chip>;
    return <Chip size="sm" color="warning">Sebagian</Chip>;
}

// ─── Modal Perekon ────────────────────────────────────────────────────────────

function PerekonModal({
    isOpen,
    onConfirm,
}: {
    isOpen: boolean;
    onConfirm: (p: Perekon) => void;
}) {
    const [nama, setNama] = useState("");
    const [nip, setNip] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (!nama.trim() || !nip.trim()) {
            setError("Nama dan NIP wajib diisi.");
            return;
        }
        if (password !== PBMD_PASSWORD) {
            setError("Password salah.");
            return;
        }
        onConfirm({ nama: nama.trim(), nip: nip.trim() });
    };

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop variant="blur">
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.Header>
                            <Modal.Heading>Identitas Perekon</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-4 p-4">
                            <p className="text-xs text-default-400">
                                Isi nama, NIP, dan password untuk melanjutkan.
                            </p>

                            <TextField name="nama" value={nama} onChange={setNama}>
                                <Label>Nama Perekon</Label>
                                <Input placeholder="Nama lengkap" />
                            </TextField>

                            <TextField name="nip" value={nip} onChange={setNip}>
                                <Label>NIP Perekon</Label>
                                <Input placeholder="NIP" />
                            </TextField>

                            <TextField
                                name="password"
                                value={password}
                                onChange={(v) => { setPassword(v); setError(""); }}
                                isInvalid={!!error}
                            >
                                <Label>Password PBMD</Label>
                                <Input type="password" placeholder="••••••••" />
                                {error && <Description className="text-danger">{error}</Description>}
                            </TextField>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="primary" onPress={handleConfirm} className="w-full">
                                Konfirmasi
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}

type PrintActionKey = "baPenelaahan" | "suratHasilPenelaahan" | "baDesk";

function PrintMenu({
    row,
    perekon,
    pengadaan,
    pemeliharaan,
}: {
    row: RkbmdBaContract.SelectDTO;
    perekon: Perekon | null;
    pengadaan: ListPengadaan[];
    pemeliharaan: ListPemeliharaan[];
}) {
    const [running, setRunning] = useState<PrintActionKey | null>(null);
    const isBusy = running !== null;

    const actions: Record<PrintActionKey, () => Promise<void>> = {
        baPenelaahan: async () => {
            if (!perekon) return;
            const filteredPengadaan = pengadaan.filter((d) => d.penggunaBarang === row.perangkatDaerah);
            const filteredPemeliharaan = pemeliharaan.filter((d) => d.penggunaBarang === row.perangkatDaerah);
            await exportBADesk(filteredPengadaan, filteredPemeliharaan, perekon, row);
        },
        suratHasilPenelaahan: async () => {
            await generateSuratHasilPenelaahan(row);
        },
        baDesk: async () => {
            if (!perekon) return;
            await generateBaDesk(perekon, row);
        },
    };

    const handleAction = async (key: React.Key) => {
        const action = key as PrintActionKey;
        if (!perekon) {
            alert("Isi data perekon terlebih dahulu");
            return;
        }
        setRunning(action);
        try {
            await actions[action]();
        } catch (err) {
            console.error(`Gagal mencetak (${action}):`, err);
            alert("Gagal mencetak dokumen. Coba lagi.");
        } finally {
            setRunning(null);
        }
    };

    return (
        <Dropdown>
            <Button size="sm" aria-label="Menu cetak" isDisabled={isBusy}>
                {isBusy ? <Spinner size="sm" /> : <Printer />}
            </Button>
            <Dropdown.Popover className="w-[320px]">
                <div className="px-3 pt-2 pb-1">
                    <span className="text-sm font-semibold">Cetak Dokumen</span>
                    <span className="block text-xs text-default-400 font-normal">
                        {row.perangkatDaerah}
                    </span>
                </div>

                <Dropdown.Menu
                    disabledKeys={isBusy ? ["baDesk", "baPenelaahan", "suratHasilPenelaahan"] : []}
                    onAction={handleAction}
                >
                    <Dropdown.Item id="baDesk" textValue="BA Desk">
                        <div className="flex h-8 items-start justify-center pt-px">
                            {running === "baDesk" ? (
                                <Spinner size="sm" />
                            ) : (
                                <FileText className="size-4 shrink-0 text-default-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Label>BA DESK</Label>
                            <Description>Berita acara PBMD dengan Pengurus Barang</Description>
                        </div>
                    </Dropdown.Item>

                    <Dropdown.Item id="baPenelaahan" textValue="BA Penelaahan">
                        <div className="flex h-8 items-start justify-center pt-px">
                            {running === "baPenelaahan" ? (
                                <Spinner size="sm" />
                            ) : (
                                <FileText className="size-4 shrink-0 text-default-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Label>BA PENELAAHAN</Label>
                            <Description>BA penelaahan usulan RKBMD oleh Pengelola Barang</Description>
                        </div>
                    </Dropdown.Item>

                    <Dropdown.Item id="suratHasilPenelaahan" textValue="Surat Hasil Penelaahan">
                        <div className="flex h-8 items-start justify-center pt-px">
                            {running === "suratHasilPenelaahan" ? (
                                <Spinner size="sm" />
                            ) : (
                                <ScrollText className="size-4 shrink-0 text-default-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Label>SURAT HASIL PENELAAHAN</Label>
                            <Description>Surat hasil penelaahan oleh Pengelola Barang</Description>
                        </div>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RkbmdBaPage() {
    const [perekon, setPerekon] = useState<Perekon | null>(null);
    const [pengadaan, setPengadaan] = useState<ListPengadaan[]>([]);
    const [pemeliharaan, setPemeliharaan] = useState<ListPemeliharaan[]>([]);
    const [data, setData] = useState<RkbmdBaContract.SelectDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<RkbmdBaContract.SelectDTO | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getRkbmdBaAction();
        if (result.success) setData(result.data.sort((a, b) => a.perangkatDaerah.localeCompare(b.perangkatDaerah)));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = data.filter(
        (d) =>
            d.perangkatDaerahId.includes(search) ||
            (d.namaPeserta ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const handleUpdated = () => {
        load();
        setSelected(null);
    };

    const loadPengadaanDanPemeliharan = useCallback(() => {
        const pengadaan = loadStorage<ListPengadaan[]>(PENGADAAN_STORAGE_KEY);
        const pemeliharaan = loadStorage<ListPemeliharaan[]>(PEMELIHARAAN_STORAGE_KEY);
        setPengadaan(pengadaan ?? []);
        setPemeliharaan(pemeliharaan ?? []);
    }, []);
    useEffect(() => {
        loadPengadaanDanPemeliharan();
    }, [loadPengadaanDanPemeliharan]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">RKBMD — Berita Acara</h1>
                <p className="text-sm text-default-400">
                    Status kelengkapan BA per perangkat daerah
                </p>
            </div>

            {perekon && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-default-100 bg-default-50 px-4 py-3">
                    <div className="text-sm">
                        <span className="text-default-400">Perekon: </span>
                        <span className="font-semibold text-foreground">{perekon.nama}</span>
                        <span className="ml-2 text-xs text-default-400">NIP {perekon.nip}</span>
                    </div>
                    <Button size="sm" variant="danger-soft" onPress={() => setPerekon(null)}>
                        Keluar
                    </Button>
                </div>
            )}

            <div className="mb-4 flex gap-2">
                <TextField name="search" value={search} onChange={setSearch} className="flex-1">
                    <Input placeholder="Cari perangkat daerah atau peserta..." />
                </TextField>
                <Button onPress={loadPengadaanDanPemeliharan}>
                    <RefreshCw /> Reload item pengadaan dan pemeliharaan
                </Button>
            </div>

            <Table>
                <Table.ScrollContainer>
                    <Table.Content aria-label="Daftar RKBMD BA">
                        <Table.Header>
                            <Table.Column isRowHeader width={160}>PERANGKAT DAERAH</Table.Column>
                            <Table.Column width={90}>PENGANTAR</Table.Column>
                            <Table.Column width={90}>PENGADAAN</Table.Column>
                            <Table.Column width={110}>PEMELIHARAAN</Table.Column>
                            <Table.Column>PESERTA</Table.Column>
                            <Table.Column width={90}>STATUS</Table.Column>
                            <Table.Column width={80}>{" "}</Table.Column>
                        </Table.Header>
                        <Table.Body>
                            {filtered.map((row) => (
                                <Table.Row key={row.perangkatDaerahId}>
                                    <Table.Cell>
                                        <span className="font-mono text-xs text-default-500">
                                            {row.perangkatDaerah}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-0.5 items-start">
                                            <div className="flex items-center gap-1">
                                                <Chip size="sm" color={row.pengantar ? "success" : "default"}>
                                                    {row.pengantar ? <Check /> : <Minus />}
                                                </Chip>
                                                <span className="text-sm font-bold">
                                                    {row.pengantarTanggal?.toLocaleDateString("id-ID")}
                                                </span>
                                            </div>
                                            <span className="text-xs">
                                                {row.pengantarNomor}
                                            </span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <Chip size="sm" color={row.pengadaan ? "success" : "default"}>
                                                {row.pengadaan ? <Check /> : <Minus />}
                                            </Chip>
                                            <span className="text-xs text-default-400 whitespace-nowrap">
                                                {pengadaan.filter((d) => d.penggunaBarang == row.perangkatDaerah).length} item
                                            </span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <Chip size="sm" color={row.pemeliharaan ? "success" : "default"}>
                                                {row.pemeliharaan ? <Check /> : <Minus />}
                                            </Chip>
                                            <span className="text-xs text-default-400 whitespace-nowrap">
                                                {pemeliharaan.filter((d) => d.penggunaBarang == row.perangkatDaerah).length} item
                                            </span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {row.namaPeserta ? (
                                            <div className="flex flex-col">
                                                <p className="text-sm font-bold">{row.namaPeserta}</p>
                                                <p className="text-xs text-default-400">{row.nipPeserta}</p>
                                                <p className="text-xs text-default-400">{row.jabatanPeserta}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-default-300">—</span>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col gap-2">
                                            {statusChip(row)}
                                            {row.tanggalPerbaikan?.toLocaleDateString("id-ID")}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex gap-2">
                                            <PrintMenu
                                                row={row}
                                                perekon={perekon}
                                                pengadaan={pengadaan}
                                                pemeliharaan={pemeliharaan}
                                            />
                                            <Button size="sm" onPress={() => setSelected(row)}>
                                                <Pen />
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>

                {!isLoading && (
                    <Table.Footer>
                        <p className="text-xs text-default-400">
                            {filtered.length} dari {data.length} perangkat daerah
                        </p>
                    </Table.Footer>
                )}
            </Table>

            <PerekonModal isOpen={!perekon} onConfirm={setPerekon} />

            {perekon && (
                <ModalBA
                    row={selected}
                    perekon={perekon}
                    onClose={() => setSelected(null)}
                    onSuccess={handleUpdated}
                />
            )}
        </div>
    );
}