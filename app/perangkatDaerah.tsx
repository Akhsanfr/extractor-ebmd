"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Card, Button, Modal, ModalHeader, ModalBody, ModalFooter,
    Input, useOverlayState, Separator, CardContent, ModalBackdrop,
    ModalContainer, ModalDialog, Label, ListBox, Autocomplete,
    SearchField, Description, Select, useFilter,
} from "@heroui/react";
import { JenisPerangkatDaerah, PerangkatDaerah, PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { loadStorage, PERANGKAT_DAERAH_KEY, saveStorage } from "@/lib/bmd-storage";
import Image from "next/image";

// --- Constants ---
const PROFILE_VERIFIED_KEY = "bmd_profile_verified";



// --- Helpers ---
function normalize(str: string) {
    return str.trim().toLowerCase();
}

function isProfileVerified(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PROFILE_VERIFIED_KEY) === "true";
}

function setProfileVerified(val: boolean) {
    localStorage.setItem(PROFILE_VERIFIED_KEY, String(val));
}

// --- Main Component ---
export default function ProfilePerangkatDaerah() {
    const { contains } = useFilter({ sensitivity: "base" });
    const state = useOverlayState();
    const [profile, setProfile] = useState<PerangkatDaerah | null>(null);
    const [pdData, setPdData] = useState<PerangkatDaerahJson[]>([]);
    // Alasan pakai ref: mencegah stale closure di dalam effect pengecekan
    const pdDataRef = useRef<PerangkatDaerahJson[]>([]);

    const { control, handleSubmit, reset, formState: { isValid }, watch, setValue } = useForm<PerangkatDaerah>({
        defaultValues: {
            jenis: JenisPerangkatDaerah.penggunaBarang,
            penggunaBarang: "",
            kuasaPenggunaBarang: "",
            namaPimpinan: "",
            nipPimpinan: "",
        },
        mode: "onChange"
    });

    const selectedPenggunaBarang = watch("penggunaBarang");
    const selectedJenis = watch("jenis");

    const penggunaBarangOptions = pdData.filter(
        (d) => d.STATUS === JenisPerangkatDaerah.penggunaBarang
    );
    const selectedPenggunaId = pdData.find((d) => d.LOKASI === selectedPenggunaBarang)?.ID ?? "";
    const kuasaOptions = pdData.filter(
        (d) =>
            d.STATUS === JenisPerangkatDaerah.kuasaPenggunaBarang &&
            d["PARENT ID"] === selectedPenggunaId
    );

    // Effect 1: Load profile dari storage (hanya sekali)
    useEffect(() => {
        console.info("EFFECT 1")
        const savedData = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);
        if (savedData) {
            console.info("Ada Profile")
            setProfile(savedData);
            reset(savedData);
            // Jangan open modal di sini — tunggu pdData load dulu (Effect 3)
        } else {

            console.info("Tidak Ada Profile")
            // Tidak ada profile sama sekali → langsung open, tandai verified (flag baru)
            setProfileVerified(true);
            state.open();
        }
    }, [reset]);

    // Effect 2: Load JSON (hanya saat modal dibuka dan data belum ada)
    useEffect(() => {
        console.info("EFFECT 2")
        if (!state.isOpen || pdData.length > 0) return;
        console.info("Fetch Data dengan kondisi State : ", state.isOpen, " atau panjang data : ", pdData.length)
        fetch("/data/perangkatDaerah.json")
            .then((res) => res.json())
            .then((data: PerangkatDaerahJson[]) => {
                setPdData(data);
                pdDataRef.current = data;
            })
            .catch(console.error);
    }, [state.isOpen]);

    // Effect 3: Pengecekan flag — dijalankan setelah pdData ter-load
    // Dependency: pdData (bukan state.isOpen) agar tidak tergantung urutan modal
    useEffect(() => {
        console.info("EFFECT 3", pdDataRef.current.length)
        if (pdDataRef.current.length === 0) return; // data belum siap

        const savedData = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);
        if (!savedData) return; // tidak ada profile, sudah ditangani Effect 1

        const verified = isProfileVerified();
        console.info("Cek data verifikasi. Hasil : ", verified)

        if (verified) return; // sudah pernah diverifikasi, skip

        // Flag false → bandingkan data lama dengan database
        console.info("Cek kesamaan data.")
        const lokasiList = pdDataRef.current.map((d) => normalize(d.LOKASI));
        const penggunaMatch = lokasiList.includes(normalize(savedData.penggunaBarang));
        console.info("Cek kesamaan data pengguna dengan hasil : ", penggunaMatch)
        const kuasaMatch =
            savedData.jenis === JenisPerangkatDaerah.penggunaBarang
                ? true // tidak perlu cek kuasa
                : lokasiList.includes(normalize(savedData.kuasaPenggunaBarang ?? ""));
        console.info("Cek kesamaan data kuasa pengguna dengan hasil : ", kuasaMatch)

        if (penggunaMatch && kuasaMatch) {
            console.info("pengguna dan kuasa sudah match.")
            // Data lama sudah sesuai database → tandai verified, tidak perlu update
            setProfileVerified(true);
        } else {

            console.info("pengguna dan kuasa tidak match.")
            // Data lama tidak ditemukan di database → paksa update
            state.open();
        }
    }, [pdData]); // intentionally only pdData

    // Effect 4: Load JSON untuk keperluan pengecekan flag
    // (dipanggil saat komponen mount, terlepas dari modal)
    useEffect(() => {
        const savedData = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);
        if (!savedData) return; // tidak ada profile, tidak perlu cek
        if (isProfileVerified()) return; // sudah verified, skip fetch

        // Fetch data untuk pengecekan (modal belum tentu terbuka)
        fetch("/data/perangkatDaerah.json")
            .then((res) => res.json())
            .then((data: PerangkatDaerahJson[]) => {
                setPdData(data);
                pdDataRef.current = data;
            })
            .catch(console.error);
    }, []);

    const handleEdit = () => {
        if (profile) reset(profile);
        state.open();
    };

    const onSubmit = (data: PerangkatDaerah) => {
        saveStorage(PERANGKAT_DAERAH_KEY, data);
        setProfileVerified(true); // selalu verified setelah submit form baru
        setProfile(data);
        state.close();
    };

    return (
        <>
            {profile && <ProfileCard profile={profile} handleEdit={handleEdit} />}
            <Modal isOpen={state.isOpen} onOpenChange={state.toggle}>
                <ModalBackdrop isDismissable={!!profile && isProfileVerified()}>
                    <ModalContainer>
                        <ModalDialog>
                            {profile && isProfileVerified() && <Modal.CloseTrigger />}
                            <ModalHeader className="flex flex-col gap-1">
                                {profile ? "Edit Profil Perangkat Daerah" : "Setup Perangkat Daerah"}
                                {!profile && (
                                    <span className="text-sm font-normal text-warning-500">
                                        Anda harus mengisi profil terlebih dahulu.
                                    </span>
                                )}
                                {profile && !isProfileVerified() && (
                                    <span className="text-sm font-normal text-warning-500">
                                        Data profil Anda tidak sesuai dengan database terbaru. Silakan perbarui.
                                    </span>
                                )}
                            </ModalHeader>

                            <ModalBody className="flex flex-col gap-4 p-2">
                                {/* Jenis Perangkat Daerah */}
                                <Controller
                                    name="jenis"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Select
                                                className="w-[256px]"
                                                placeholder="Pilih jenis"
                                                defaultValue={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    if (val === JenisPerangkatDaerah.penggunaBarang) {
                                                        setValue("kuasaPenggunaBarang", "");
                                                    }
                                                }}
                                            >
                                                <Label htmlFor="jenis">Jenis Perangkat Daerah</Label>
                                                <Select.Trigger>
                                                    <Select.Value />
                                                    <Select.Indicator />
                                                </Select.Trigger>
                                                <Select.Popover>
                                                    <ListBox>
                                                        <ListBox.Item
                                                            id={JenisPerangkatDaerah.penggunaBarang}
                                                            textValue={JenisPerangkatDaerah.penggunaBarang}
                                                        >
                                                            {JenisPerangkatDaerah.penggunaBarang}
                                                            <ListBox.ItemIndicator />
                                                        </ListBox.Item>
                                                        <ListBox.Item
                                                            id={JenisPerangkatDaerah.kuasaPenggunaBarang}
                                                            textValue={JenisPerangkatDaerah.kuasaPenggunaBarang}
                                                        >
                                                            {JenisPerangkatDaerah.kuasaPenggunaBarang}
                                                            <ListBox.ItemIndicator />
                                                        </ListBox.Item>
                                                    </ListBox>
                                                </Select.Popover>
                                            </Select>
                                        </div>
                                    )}
                                />

                                {/* Pengguna Barang */}
                                <Controller
                                    name="penggunaBarang"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Autocomplete
                                            selectedKey={field.value}
                                            onSelectionChange={(key) => {
                                                field.onChange(key ?? "");
                                                setValue("kuasaPenggunaBarang", "");
                                            }}
                                        >
                                            <Label>Pengguna Barang</Label>
                                            <Autocomplete.Trigger>
                                                <Autocomplete.Value />
                                                <Autocomplete.ClearButton />
                                                <Autocomplete.Indicator />
                                            </Autocomplete.Trigger>
                                            <Autocomplete.Popover>
                                                <Autocomplete.Filter filter={contains}>
                                                    <SearchField>
                                                        <SearchField.Group>
                                                            <SearchField.SearchIcon />
                                                            <SearchField.Input placeholder="Pilih pengguna barang..." />
                                                        </SearchField.Group>
                                                    </SearchField>
                                                    <ListBox>
                                                        {penggunaBarangOptions.map((item) => (
                                                            <ListBox.Item key={item.LOKASI} id={item.LOKASI} textValue={item.LOKASI}>
                                                                <Label>{item.LOKASI}</Label>
                                                                <ListBox.ItemIndicator />
                                                            </ListBox.Item>
                                                        ))}
                                                    </ListBox>
                                                </Autocomplete.Filter>
                                            </Autocomplete.Popover>
                                        </Autocomplete>
                                    )}
                                />

                                {/* Kuasa Pengguna Barang */}
                                {selectedJenis === JenisPerangkatDaerah.kuasaPenggunaBarang && (
                                    <Controller
                                        name="kuasaPenggunaBarang"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                selectedKey={field.value}
                                                onSelectionChange={(key) => field.onChange(key ?? "")}
                                                isDisabled={!selectedPenggunaBarang}
                                            >
                                                <Label>Kuasa Pengguna Barang</Label>
                                                <Autocomplete.Trigger>
                                                    <Autocomplete.Value />
                                                    <Autocomplete.ClearButton />
                                                    <Autocomplete.Indicator />
                                                </Autocomplete.Trigger>
                                                <Description className="text-xs text-muted">
                                                    Hanya menampilkan unit di bawah pengguna barang yang dipilih.
                                                </Description>
                                                <Autocomplete.Popover>
                                                    <Autocomplete.Filter filter={contains}>
                                                        <SearchField>
                                                            <SearchField.Group>
                                                                <SearchField.SearchIcon />
                                                                <SearchField.Input placeholder="Pilih kuasa pengguna barang..." />
                                                            </SearchField.Group>
                                                        </SearchField>
                                                        <ListBox>
                                                            {kuasaOptions.length > 0 ? (
                                                                kuasaOptions.map((item) => (
                                                                    <ListBox.Item key={item.LOKASI} id={item.LOKASI} textValue={item.LOKASI}>
                                                                        <Label>{item.LOKASI}</Label>
                                                                        <ListBox.ItemIndicator />
                                                                    </ListBox.Item>
                                                                ))
                                                            ) : (
                                                                <ListBox.Item id="__empty" isDisabled textValue="Tidak ada data">
                                                                    <Label className="text-muted text-sm">
                                                                        Tidak ada kuasa untuk pengguna ini
                                                                    </Label>
                                                                </ListBox.Item>
                                                            )}
                                                        </ListBox>
                                                    </Autocomplete.Filter>
                                                </Autocomplete.Popover>
                                            </Autocomplete>
                                        )}
                                    />
                                )}

                                {/* Nama Pimpinan */}
                                <Controller
                                    name="namaPimpinan"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="namaPimpinan">Nama Pimpinan</Label>
                                            <Input {...field} required placeholder="Masukkan nama lengkap pimpinan" />
                                        </div>
                                    )}
                                />

                                {/* NIP Pimpinan */}
                                <Controller
                                    name="nipPimpinan"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="nipPimpinan">NIP Pimpinan</Label>
                                            <Input {...field} required placeholder="Contoh: 19800101 200501 1 001" />
                                        </div>
                                    )}
                                />
                            </ModalBody>

                            <ModalFooter>
                                {profile && isProfileVerified() && (
                                    <Button variant="danger" onPress={state.close}>
                                        Batal
                                    </Button>
                                )}
                                <Button onClick={handleSubmit(onSubmit)} isDisabled={!isValid}>
                                    Simpan Profil
                                </Button>
                            </ModalFooter>
                        </ModalDialog>
                    </ModalContainer>
                </ModalBackdrop>
            </Modal>
        </>
    );
}

export function ProfileCard({ profile, handleEdit }: { profile: PerangkatDaerah; handleEdit: () => void }) {
    return (
        <Card>
            <CardContent className="flex flex-row items-center gap-2">
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <Image src="/logo.png" width={88} height={88} alt="Logo instansi" className="object-cover" />
                    <p className="text-xs font-medium text-default-500 text-center leading-snug">
                        Pemerintah Kabupaten Pasuruan
                    </p>
                    <Button onPress={handleEdit}>Edit Profile</Button>
                </div>
                <Separator orientation="vertical" />
                <div className="flex flex-col gap-2">
                    <Field label="Pengguna Barang" value={profile.penggunaBarang} />
                    <Field label="Jenis" value={profile.jenis} />
                    {profile.jenis === JenisPerangkatDaerah.kuasaPenggunaBarang && (
                        <Field label="Kuasa Pengguna Barang" value={profile.kuasaPenggunaBarang} />
                    )}
                    <Field label="Nama Pimpinan" value={profile.namaPimpinan} />
                    <Field label="NIP Pimpinan" value={profile.nipPimpinan} />
                </div>
            </CardContent>
        </Card>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-muted font-medium">{label}</span>
            <span className="font-bold">{value}</span>
        </div>
    );
}