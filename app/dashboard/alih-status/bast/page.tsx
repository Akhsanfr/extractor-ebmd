"use client";

import { useCallback, useMemo, useState } from "react";
import {
    Button,
    toast,
    Modal,
    useOverlayState,
    ButtonGroup,
    ButtonGroupSeparator,
} from "@heroui/react";
import { Eye, Plus, RefreshCw, Trash } from "lucide-react";
import { AlihStatusBASTContract } from "@/action/alih-status/bast/contract";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract"; // sesuaikan path bila berbeda
import { actionDeleteAlihStatusBAST } from "@/action/alih-status/bast/action.delete";
import { actionGetListAlihStatusBAST } from "@/action/alih-status/bast/action.read";
import { actionCreateAlihStatusBAST } from "@/action/alih-status/bast/action.create";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TextFormField } from "../_component/formField";
import { useStore } from "@nanostores/react";
import { $year } from "@/state/year.store";
import { useForm } from "react-hook-form";
import ListAvailableNodin from "./ListAvailablePersetujuanBupati";
import DetailBAST from "../_component/bast";
import ListAvailableData from "../_component/listAvailableData";
import PilihPerangkatDaerahAsal from "./pilihPerangkatDaerahAsal";
import { actionGetListPenggunaBarangForBAST } from "@/action/alih-status/bast/action.read";
import Loading from "@/component/loading";



const queryKey = ["alih-status", "bast"];
const STEPS = ["permohonan", "data", "asal", "ba"] as const;
type FormStep = (typeof STEPS)[number];

// satu pasangan Perangkat Daerah Asal + Tujuan — data yang dipilih user
// difilter berdasarkan pasangan ini, bukan hanya berdasarkan asal saja
type PerangkatDaerahPair = {
    perangkatDaerahAsal: string;
    perangkatDaerahTujuan: string;
};

export default function BAST() {
    const tahun = useStore($year);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedPersetujuanBupatiIds, setSelectedPersetujuanBupatiIds] = useState<number[]>([])

    // data lengkap yang dipilih pada step "data", dipakai untuk menghitung
    // daftar unik pasangan Perangkat Daerah Asal + Tujuan pada step "asal"
    const [selectedData, setSelectedData] = useState<AlihStatusDataContract.SelectDTO[]>([]);
    const [selectedPerangkatDaerahPair, setSelectedPerangkatDaerahPair] = useState<PerangkatDaerahPair | null>(null);

    const [formSelected, setFormSelected] = useState<FormStep>("permohonan")

    const form = useForm<AlihStatusBASTContract.CreateDTO>({
        defaultValues: {
            tahun: Number(tahun),
            suratNomor: `000.2.3.2/     /     /${tahun}`
        }
    });

    const stepIndex = STEPS.indexOf(formSelected);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    // daftar unik pasangan Perangkat Daerah Asal + Tujuan dari data yang dipilih
    const uniquePerangkatDaerahPairs = useMemo(() => {
        const map = new Map<string, PerangkatDaerahPair>();
        for (const row of selectedData) {
            if (!row.perangkatDaerahAsal || !row.perangkatDaerahTujuan) continue;
            const key = `${row.perangkatDaerahAsal}|||${row.perangkatDaerahTujuan}`;
            if (!map.has(key)) {
                map.set(key, {
                    perangkatDaerahAsal: row.perangkatDaerahAsal,
                    perangkatDaerahTujuan: row.perangkatDaerahTujuan,
                });
            }
        }
        return Array.from(map.values());
    }, [selectedData]);

    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            if (!tahun) throw new Error("Tahun belum dipilih")
            const res = await actionGetListAlihStatusBAST(Number(tahun));
            console.log("res", res)
            if (!res.success) {
                throw res.error;
            }
            return res.data;
        },
    });

    const handleDelete = async (id: number) => {
        try {
            const result = await actionDeleteAlihStatusBAST({ id });
            if (!result.success) {
                throw result.error;
            }
            toast.success("Permohonan alih status berhasil dihapus");
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusBASTContract.SelectDTO[]) => {
                    if (!old) return old;

                    return old.filter(d => d.id !== id)
                },
            );
        } catch (error: any) {
            toast.danger("Gagal permohonan alih status", { description: error.message });
        }
    };

    // reset seluruh state wizard, dipanggil saat modal ditutup / dibuka ulang
    const resetWizard = () => {
        setFormSelected("permohonan");
        setSelectedPersetujuanBupatiIds([]);
        setSelectedData([]);
        setSelectedPerangkatDaerahPair(null);
    };

    // dipanggil saat user memilih pasangan Perangkat Daerah Asal + Tujuan
    // pada step "asal". Set kedua field form, filter ulang data sesuai
    // pasangan terpilih, lalu lanjut ke step "ba"
    //
    // contoh: selectedData berisi id 1,2,3,4,5 -> 1,2 punya pasangan
    // (Asal: A, Tujuan: X), 3,4,5 punya pasangan (Asal: B, Tujuan: Y).
    // Jika user memilih pasangan (A, X), dataIds final hanya berisi 1,2.
    const handleSelectPerangkatDaerahPair = (pair: PerangkatDaerahPair) => {
        setSelectedPerangkatDaerahPair(pair);
        form.setValue("perangkatDaerahAsal", pair.perangkatDaerahAsal);
        form.setValue("perangkatDaerahTujuan", pair.perangkatDaerahTujuan);

        const filteredRows = selectedData.filter(
            (row) =>
                row.perangkatDaerahAsal === pair.perangkatDaerahAsal &&
                row.perangkatDaerahTujuan === pair.perangkatDaerahTujuan
        );
        form.setValue("dataIds", filteredRows.map((d) => d.id));

        // pindah step dulu supaya UI tidak menunggu, form terisi begitu response datang
        setFormSelected("ba");
        void fillPenggunaBarang(filteredRows[0]);
    };

    const handleNext = () => {
        if (formSelected === "permohonan" && selectedPersetujuanBupatiIds.length === 0) {
            toast.warning("Pilih minimal satu permohonan terlebih dahulu");
            return;
        }
        if (formSelected === "data") {
            if (selectedData.length === 0) {
                toast.warning("Pilih minimal satu data terlebih dahulu");
                return;
            }
            // jika hanya ada satu pasangan Perangkat Daerah Asal + Tujuan,
            // tidak perlu tanya user, langsung set dan lompat ke step "ba"
            if (uniquePerangkatDaerahPairs.length === 1) {
                handleSelectPerangkatDaerahPair(uniquePerangkatDaerahPairs[0]);
                return;
            }
            if (uniquePerangkatDaerahPairs.length === 0) {
                toast.warning("Perangkat Daerah Asal/Tujuan tidak ditemukan pada data yang dipilih");
                return;
            }
            setFormSelected("asal");
            return;
        }
        if (formSelected === "asal") {
            if (!selectedPerangkatDaerahPair) {
                toast.warning("Pilih Perangkat Daerah Asal dan Tujuan terlebih dahulu");
                return;
            }
            setFormSelected("ba");
            return;
        }
        const nextIndex = stepIndex + 1;
        if (nextIndex < STEPS.length) {
            setFormSelected(STEPS[nextIndex]);
        }
    };

    const handlePrev = () => {
        const prevIndex = stepIndex - 1;
        if (prevIndex >= 0) {
            setFormSelected(STEPS[prevIndex]);
        }
    };

    const handleCloseModal = () => {
        state.close();
        resetWizard();
    };

    const state = useOverlayState();

    // stabilkan identitas onChange yang dikirim ke ListAvailableData —
    // setSelectedData/setSelectedPerangkatDaerahPair dari useState sudah
    // stabil, jadi callback ini aman dengan deps kosong. Tanpa ini, inline
    // arrow function baru di setiap render bisa memicu infinite loop di
    // effect ListAvailableData (lihat "Maximum update depth exceeded").
    const handleAvailableDataChange = useCallback(
        (e: AlihStatusDataContract.SelectDTO[]) => {
            // JANGAN set dataIds di sini — dataIds baru final setelah user
            // memilih pasangan Perangkat Daerah Asal + Tujuan (lihat
            // handleSelectPerangkatDaerahPair), karena data ini masih harus
            // difilter ulang sesuai pasangan tersebut
            setSelectedData(e);
            // data berubah -> pasangan Perangkat Daerah sebelumnya bisa jadi
            // sudah tidak relevan, minta user pilih ulang
            setSelectedPerangkatDaerahPair(null);
        },
        []
    );

    const onSubmit = async (values: AlihStatusBASTContract.CreateDTO) => {
        try {
            const result = await actionCreateAlihStatusBAST({ ...values, suratTanggal: values.suratTanggal === "" ? null : values.suratTanggal })
            if (!result.success) throw result.error;
            toast.success("BA Penelitian berhasil ditambahkan")
            queryClient.setQueryData(
                queryKey,
                (old: AlihStatusBASTContract.SelectDTO[]) => {
                    if (!old) return old;

                    return [...old, result.data]
                },
            );
            state.close();
        } catch (error: any) {
            toast.danger("Gagal menambahkan BA Penelitian", { description: error.message });
        }
    };
    const onError = (formErrors: unknown) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(formErrors) });
    };

    const refresh = () => {
        queryClient.refetchQueries({
            queryKey
        })
    }

    const [isFetchingPenggunaBarang, setIsFetchingPenggunaBarang] = useState(false);
    // ambil pengguna barang asal & tujuan berdasarkan permohonanId + spkmbId
    // dari satu data (index 0), lalu isi field form pengguna barang
    const fillPenggunaBarang = async (row: AlihStatusDataContract.SelectDTO | undefined) => {
        if (!row) return;

        const { permohonanId, spkmbId } = row;
        if (permohonanId == null || spkmbId == null) {
            toast.warning("Permohonan/SPKMB tidak ditemukan pada data terpilih", {
                description: "Data pengguna barang perlu diisi manual",
            });
            return;
        }

        setIsFetchingPenggunaBarang(true);
        try {
            const res = await actionGetListPenggunaBarangForBAST(permohonanId, spkmbId);
            if (!res.success) throw res.error;

            const { asal, tujuan } = res.data;

            form.setValue("penggunaBarangAsalNama", asal.nama ?? "");
            form.setValue("penggunaBarangAsalNIP", asal.nip ?? "");
            form.setValue("penggunaBarangAsalPangkat", asal.pangkat ?? "");
            form.setValue("penggunaBarangAsalJabatan", asal.jabatan ?? "");

            form.setValue("penggunaBarangTujuanNama", tujuan.nama);
            form.setValue("penggunaBarangTujuanNIP", tujuan.nip);
            form.setValue("penggunaBarangTujuanPangkat", tujuan.pangkat);
            form.setValue("penggunaBarangTujuanJabatan", tujuan.jabatan ?? "");
        } catch (error: any) {
            toast.warning("Gagal mengambil data pengguna barang", {
                description: error?.message ?? "Silakan isi manual",
            });
        } finally {
            setIsFetchingPenggunaBarang(false);
        }
    };
    return (
        <>
            <DetailBAST
                action={
                    <ButtonGroup>
                        <Button variant="outline" isPending={query.isRefetching} onPress={refresh}>
                            <RefreshCw className={query.isRefetching ? "animate-spin" : ""} />
                        </Button>
                        <Button variant="outline" onPress={() => { resetWizard(); state.open(); }}>
                            <ButtonGroupSeparator />
                            <Plus />
                        </Button>
                    </ButtonGroup>}
                data={query.data ?? []} isLoading={query.isLoading} shouldTable={true} rowAction={(row) =>
                    <ButtonGroup>
                        <Button
                            variant="secondary" size='sm'
                            onPress={() =>
                                router.push(
                                    `/dashboard/alih-status/bast/${row.id}`
                                )
                            }
                        >
                            <Eye />
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onPress={() => handleDelete(row.id)}
                        >
                            <Trash />
                        </Button>
                    </ButtonGroup>
                }
            />
            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container size={formSelected === "ba" ? "lg" : "cover"}>
                        <Modal.Dialog>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
                                <Modal.CloseTrigger onPress={handleCloseModal} />
                                <Modal.Header>
                                    <Modal.Heading>
                                        Tambah Nota Dinas
                                    </Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {
                                        formSelected === "permohonan" ? (
                                            <ListAvailableNodin onChange={(permohonans) => {
                                                setSelectedPersetujuanBupatiIds(permohonans.map((e) => e.id))
                                            }} />
                                        ) : formSelected === "data" ? (
                                            <ListAvailableData
                                                column="persetujuanBupatiId"
                                                values={selectedPersetujuanBupatiIds}
                                                onChange={handleAvailableDataChange}
                                            />
                                        ) : formSelected === "asal" ? (
                                            <PilihPerangkatDaerahAsal
                                                data={selectedData}
                                                selected={selectedPerangkatDaerahPair}
                                                onSelect={handleSelectPerangkatDaerahPair}
                                            />
                                        ) : (

                                            <div className="grid grid-cols-2 gap-4">
                                                <TextFormField label="Nomor BAST" control={form.control} errors={form.formState.errors} name="suratNomor" />
                                                <TextFormField label="Tanggal BAST" type="date" control={form.control} errors={form.formState.errors} name="suratTanggal" />
                                                <TextFormField className="col-span-2" label="Perangkat Daerah Asal" control={form.control} errors={form.formState.errors} name="perangkatDaerahAsal" />
                                                {
                                                    isFetchingPenggunaBarang ? (
                                                        <Loading />
                                                    ) : (
                                                        <>
                                                            <TextFormField label="Nama Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalNama" />
                                                            <TextFormField label="NIP Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalNIP" />
                                                            <TextFormField label="Pangkat Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalPangkat" />
                                                            <TextFormField label="Jabatan Pengguna Barang Asal" control={form.control} errors={form.formState.errors} name="penggunaBarangAsalJabatan" />
                                                        </>
                                                    )
                                                }
                                                <TextFormField className="col-span-2" label="Perangkat Daerah Tujuan" control={form.control} errors={form.formState.errors} name="perangkatDaerahTujuan" />
                                                {
                                                    isFetchingPenggunaBarang ? (
                                                        <Loading />
                                                    ) : (
                                                        <>
                                                            <TextFormField label="Nama Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanNama" />
                                                            <TextFormField label="NIP Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanNIP" />
                                                            <TextFormField label="Pangkat Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanPangkat" />
                                                            <TextFormField label="Jabatan Pengguna Barang Tujuan" control={form.control} errors={form.formState.errors} name="penggunaBarangTujuanJabatan" />
                                                        </>
                                                    )
                                                }
                                            </div>
                                        )
                                    }
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        onPress={handlePrev}
                                        isDisabled={isFirstStep}
                                    >
                                        Sebelumnya
                                    </Button>
                                    {isLastStep ? (
                                        <Button
                                            type="button"
                                            onClick={form.handleSubmit(onSubmit, onError)}
                                            isPending={isFetchingPenggunaBarang}
                                        >
                                            Simpan
                                        </Button>
                                    ) : formSelected === "asal" ? (
                                        // step "asal" berpindah otomatis saat user memilih,
                                        // jadi tombol "Selanjutnya" tidak relevan di sini
                                        null
                                    ) : (
                                        <Button type="button" onPress={handleNext}>
                                            Selanjutnya
                                        </Button>
                                    )}
                                </Modal.Footer>
                            </form>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal >
        </>
    );
}