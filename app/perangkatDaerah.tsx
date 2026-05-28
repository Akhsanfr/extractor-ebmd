"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Card,
    CardHeader,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    useOverlayState,
    Separator,
    CardContent,
    ModalBackdrop,
    ModalContainer,
    ModalDialog,
    Label,
    ListBox,
    Chip,
} from "@heroui/react";
import { JenisPerangkatDaerah, PerangkatDaerah } from "@/types/perangkatDaerah";
import { loadStorage, PERANGKAT_DAERAH_KEY, saveStorage } from "@/lib/bmd-storage";
import Image from "next/image";
import { Building, Building2, IdCard, Tag, User } from "lucide-react";


type PerangkatDaerahJson = {
    ID: string;
    LOKASI: string;
    STATUS: JenisPerangkatDaerah;
    "PARENT ID": string;
}


// --- 3. Main Component ---
export default function ProfilePerangkatDaerah() {
    const state = useOverlayState();
    const [profile, setProfile] = useState<PerangkatDaerah | null>(null);

    // Setup react-hook-form
    const { control, handleSubmit, reset, formState: { isValid }, watch } = useForm<PerangkatDaerah>({
        defaultValues: {
            jenis: JenisPerangkatDaerah.penggunaBarang,
            penggunaBarang: "",
            kuasaPenggunaBarang: "",
            namaPimpinan: "",
            nipPimpinan: "",
        },
        mode: "onChange"
    });

    // Load data saat komponen pertama kali di-render (Client-side)
    useEffect(() => {
        const savedData = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);

        // Jika data ada dan array tidak kosong, set profile
        if (savedData) {
            setProfile(savedData);
            reset(savedData);
        } else {
            // Auto open modal jika tidak ada data
            state.open();
        }
    }, [state.isOpen, reset]);


    const openModal = () => {
        // load perangkat daerah json
    }

    // Handler untuk membuka modal dalam mode Edit
    const handleEdit = () => {
        if (profile) {
            reset(profile);
        }
        state.open();
    };

    // Handler untuk menyimpan data
    const onSubmit = (data: PerangkatDaerah) => {
        // Simpan ke localStorage (sebagai array sesuai tipe fungsi loadStorage)
        saveStorage(PERANGKAT_DAERAH_KEY, data);

        // Update state tampilan
        setProfile(data);
        state.close();
    };

    return (
        <>
            {profile &&
                <ProfileCard profile={profile}
                    handleEdit={handleEdit} />
            }
            <Modal
                isOpen={state.isOpen}
                onOpenChange={state.toggle}
            ><ModalBackdrop
                isDismissable={!!profile}
            >
                    <ModalContainer>
                        <ModalDialog>{
                            !profile &&
                            <Modal.CloseTrigger />
                        }
                            <ModalHeader className="flex flex-col gap-1" >
                                {profile ? "Edit Profil Perangkat Daerah" : "Setup Perangkat Daerah"}
                                {
                                    !profile && (
                                        <span className="text-sm font-normal text-warning-500" >
                                            Anda harus mengisi profil terlebih dahulu.
                                        </span>
                                    )
                                }
                            </ModalHeader>
                            < ModalBody className="flex flex-col gap-4 p-2" >
                                <Controller
                                    name="jenis"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Select className="w-[256px]" placeholder="Select one" defaultValue={field.value}
                                                onChange={(val) => field.onChange(val)}>
                                                <Label htmlFor="jenis">Jenis Perangkat Daerah</Label>
                                                <Select.Trigger>
                                                    <Select.Value />
                                                    <Select.Indicator />
                                                </Select.Trigger>
                                                <Select.Popover>
                                                    <ListBox>
                                                        <ListBox.Item id={JenisPerangkatDaerah.penggunaBarang} textValue={JenisPerangkatDaerah.penggunaBarang}>
                                                            {JenisPerangkatDaerah.penggunaBarang}
                                                            <ListBox.ItemIndicator />
                                                        </ListBox.Item>
                                                        <ListBox.Item id={JenisPerangkatDaerah.kuasaPenggunaBarang} textValue={JenisPerangkatDaerah.kuasaPenggunaBarang}>
                                                            {JenisPerangkatDaerah.kuasaPenggunaBarang}
                                                            <ListBox.ItemIndicator />
                                                        </ListBox.Item>
                                                    </ListBox>
                                                </Select.Popover>
                                            </Select>
                                        </div>
                                    )}
                                />
                                < Controller
                                    name="penggunaBarang"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="penggunaBarang">Nama Pengguna Barang</Label>
                                            <Input
                                                {...field}
                                                required
                                                placeholder="Masukkan nama pengguna barang"
                                            />
                                        </div>
                                    )}
                                />
                                {
                                    watch("jenis") === JenisPerangkatDaerah.kuasaPenggunaBarang &&
                                    < Controller
                                        name="kuasaPenggunaBarang"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <div className="flex flex-col gap-1">
                                                <Label htmlFor="kuasaPenggunaBarang">Nama Kuasa Pengguna Barang</Label>
                                                <Input
                                                    {...field}
                                                    required
                                                    placeholder="Masukkan nama kuasa pengguna barang"
                                                />
                                            </div>
                                        )}
                                    />

                                }

                                < Controller
                                    name="namaPimpinan"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="namaPimpinan">Nama Pimpinan</Label>
                                            <Input
                                                {...field}
                                                required
                                                placeholder="Masukkan nama lengkap pimpinan"
                                            />
                                        </div>
                                    )}
                                />

                                < Controller
                                    name="nipPimpinan"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="nipPimpinan">NIP Pimpinan</Label>
                                            <Input
                                                {...field}
                                                required
                                                placeholder="Contoh: 19800101 200501 1 001"
                                            />
                                        </div>
                                    )}
                                />
                            </ModalBody>

                            <ModalFooter>
                                {/* Tombol batal hanya muncul jika data profil sudah pernah ada */}
                                {
                                    profile && (
                                        <Button variant="danger" onPress={state.close} >
                                            Batal
                                        </Button>
                                    )
                                }
                                <Button
                                    onClick={handleSubmit(onSubmit)}
                                    isDisabled={!isValid}
                                >
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

export function ProfileCard({ profile, handleEdit }: { profile: PerangkatDaerah, handleEdit: () => void }) {
    const fields = [
        { label: "Pengguna barang", value: profile.penggunaBarang, icon: <Building2 size={14} /> },
        { label: "Kuasa pengguna barang", value: profile.kuasaPenggunaBarang, icon: <Building2 size={14} /> },
        { label: "Jenis", value: profile.jenis, icon: <Tag size={14} />, isChip: true },
        { label: "Nama pimpinan", value: profile.namaPimpinan, icon: <User size={14} /> },
        { label: "NIP pimpinan", value: profile.nipPimpinan, icon: <IdCard size={14} />, mono: true },
    ];
    return (
        <Card>
            <CardContent className="flex flex-row  items-center gap-2">
                {/* Kolom kiri */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <Image
                        src="/logo.png"
                        width={88}
                        height={88}
                        alt="Logo instansi"
                        className="object-cover"
                    />
                    <p className="text-xs font-medium text-default-500 text-center leading-snug">
                        Pemerintah Kabupaten Pasuruan
                    </p>
                    <Button onPress={handleEdit}>
                        Edit Profile
                    </Button>
                </div>

                <Separator orientation="vertical" />
                <div className="flex flex-col gap-2">
                    <Field label="Pengguna Barang" value={profile.penggunaBarang} />
                    <Field label="Jenis" value={profile.jenis} />
                    {
                        profile.jenis == JenisPerangkatDaerah.kuasaPenggunaBarang &&
                        <Field label="Kuasa Pengguna Barang" value={profile.kuasaPenggunaBarang} />
                    }
                    <Field label="Nama Pimpinan" value={profile.namaPimpinan} />
                    <Field label="NIP Pimpinan" value={profile.nipPimpinan} />
                </div>
            </CardContent>
        </Card >
    );
}

function Field({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-muted font-medium ">
                {label}
            </span>
            <span className="font-bold">{value}</span>
        </div>
    );
}