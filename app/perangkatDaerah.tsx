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
} from "@heroui/react";
import { JenisPerangkatDaerah, PerangkatDaerah } from "@/types/perangkatDaerah";
import { loadStorage, PERANGKAT_DAERAH_KEY, saveStorage } from "@/lib/bmd-storage";



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
        <div className="p-4 w-full max-w-2xl mx-auto" >
            {/* --- Bagian 1: Detail Perangkat Daerah --- */}
            {
                profile && (
                    <Card className="w-full shadow-md" >
                        <CardHeader className="flex justify-between items-center px-6 py-4" >
                            <div className="flex flex-col" >
                                <h2 className="text-xl font-bold text-default-900" >
                                    Profil Perangkat Daerah
                                </h2>
                                < p className="text-sm text-default-500" >
                                    Informasi detail satuan kerja
                                </p>
                            </div>
                            <Button onPress={handleEdit} >
                                Edit Profil
                            </Button>
                        </CardHeader>
                        < Separator />
                        <CardContent className="px-6 py-4 gap-4" >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                                <div>
                                    <p className="text-sm text-default-500" > Pengguna Barang </p>
                                    < p className="text-md font-semibold" > {profile.penggunaBarang} </p>
                                </div>
                                {
                                    profile.jenis === JenisPerangkatDaerah.kuasaPenggunaBarang && <div>
                                        <p className="text-sm text-default-500" >Kuasa Pengguna Barang </p>
                                        < p className="text-md font-semibold" > {profile.kuasaPenggunaBarang} </p>
                                    </div>
                                }
                                < div >
                                    <p className="text-sm text-default-500" > Jenis </p>
                                    < p className="text-md font-semibold" > {profile.jenis} </p>
                                </div>
                                < div >
                                    <p className="text-sm text-default-500" > Nama Pimpinan </p>
                                    < p className="text-md font-semibold" > {profile.namaPimpinan} </p>
                                </div>
                                < div >
                                    <p className="text-sm text-default-500" > NIP Pimpinan </p>
                                    < p className="text-md font-semibold" > {profile.nipPimpinan} </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* --- Bagian 2: Form Modal Create / Edit --- */}
            <Modal
                isOpen={state.isOpen}
                onOpenChange={state.toggle}
            // hideCloseButton={!profile}
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
        </div>
    );
}