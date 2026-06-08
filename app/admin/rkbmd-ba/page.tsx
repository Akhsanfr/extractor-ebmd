"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Chip, Description, Input, Label, Modal, Table, TextField } from "@heroui/react";
import { getRkbmdBaAction, updateRkbmdBaAction } from "@/action/rkbmdBa/rkbmd-ba-action";
import { RkbmdBaContract } from "@/action/rkbmdBa/rkbmd-ba-contract";
import { Check, Minus } from "lucide-react";

interface Perekon {
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

// ─── Modal Edit BA ────────────────────────────────────────────────────────────

function EditBaModal({
    row,
    perekon,
    onClose,
    onSuccess,
}: {
    row: RkbmdBaContract.SelectDTO | null;
    perekon: Perekon;
    onClose: () => void;
    onSuccess: (updated: RkbmdBaContract.SelectDTO) => void;
}) {
    const isOpen = !!row;

    const [pengantar, setPengantar] = useState(false);
    const [pengadaan, setPengadaan] = useState(false);
    const [pemeliharaan, setPemeliharaan] = useState(false);
    const [namaPeserta, setNamaPeserta] = useState("");
    const [nipPeserta, setNipPeserta] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!row) return;
        setPengantar(row.pengantar);
        setPengadaan(row.pengadaan);
        setPemeliharaan(row.pemeliharaan);
        setNamaPeserta(row.namaPeserta ?? "");
        setNipPeserta(row.nipPeserta ?? "");
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
            updatedBy: `${perekon.nama} (${perekon.nip})`,
        });
        setSaving(false);
        if (!result.success) {
            // setError(result.message ?? "Gagal menyimpan.");
            return;
        }
        onSuccess(result.data);
        onClose();
    };

    return (
        <Modal isOpen={isOpen}>
            <Modal.Backdrop >
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger onPress={onClose} />
                        <Modal.Header>
                            <Modal.Heading>Edit BA — {row?.perangkatDaerahId}</Modal.Heading>
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
                                </div>
                            </div>

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RkbmdBaPage() {
    const [perekon, setPerekon] = useState<Perekon | null>({ nama: "Fernanda", nip: "1999" });
    const [data, setData] = useState<RkbmdBaContract.SelectDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<RkbmdBaContract.SelectDTO | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getRkbmdBaAction();
        if (result.success) setData(result.data);
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

    const handleUpdated = (updated: RkbmdBaContract.SelectDTO) => {
        setData((prev) =>
            prev.map((d) => (d.perangkatDaerahId === updated.perangkatDaerahId ? updated : d))
        );
    };

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

            <div className="mb-4">
                <TextField name="search" value={search} onChange={setSearch}>
                    <Input placeholder="Cari perangkat daerah atau peserta..." />
                </TextField>
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
                                        <Chip size="sm" color={row.pengantar ? "success" : "default"}>
                                            {row.pengantar ? <Check /> : <Minus />}
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" color={row.pengadaan ? "success" : "default"}>
                                            {row.pengadaan ? <Check /> : <Minus />}
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" color={row.pemeliharaan ? "success" : "default"}>
                                            {row.pemeliharaan ? <Check /> : <Minus />}
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {row.namaPeserta ? (
                                            <div>
                                                <p className="text-sm">{row.namaPeserta}</p>
                                                <p className="text-xs text-default-400">{row.nipPeserta}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-default-300">—</span>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>{statusChip(row)}</Table.Cell>
                                    <Table.Cell>
                                        <Button size="sm" onPress={() => setSelected(row)}>
                                            Edit
                                        </Button>
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
                <EditBaModal
                    row={selected}
                    perekon={perekon}
                    onClose={() => setSelected(null)}
                    onSuccess={handleUpdated}
                />
            )}
        </div>
    );
}