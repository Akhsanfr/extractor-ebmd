"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Autocomplete,
    Button,
    Description,
    Input,
    Label,
    ListBox,
    Modal,
    SearchField,
    Select,
    TextField,
    toast,
    useOverlayState,
} from "@heroui/react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSyncJob } from "@/action/sync/syncJob/syncJob.action.create";
import { SyncJobContract } from "@/action/sync/syncJob/syncJob.contract";
import { BmdAssetType } from "@/enum/bmd";
import { actionGetListPerangkatDaerahByJabatan, getPerangkatDaerahAction } from "@/action/perangkatDaerah/action";
import { PerangkatDaerahContract } from "@/action/perangkatDaerah/perangkatDaerah.contract";
import { Plus } from "lucide-react";
import { PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";
import { file } from "zod";
// TODO: replace with your actual data source for perangkat daerah / lokasi options
// e.g. import { usePerangkatDaerahOptions } from "@/action/perangkatDaerah/perangkatDaerah.hook";

const ASSET_TYPE_OPTIONS = Object.entries(BmdAssetType).map(([key, value]) => ({
    key: value,
    label: key,
}));

// Only "ebmd" exists in SyncJobContract.create today. Add entries here
// (and to the union in the contract) as more job types come online.
const JOB_TYPE_OPTIONS = [{ key: "ebmd", label: "EBMD" }] as const;

const DEFAULT_VALUES: SyncJobContract.CreateDTO = {
    jobType: "ebmd",
    name: "",
    lokasi: [],
    assetType: [],
} as SyncJobContract.CreateDTO;

export function CreateSyncJobModal({ onSuccess }: { onSuccess: () => void }) {
    const [perangkatDaerah, setPerangkatDaerah] = useState<PerangkatDaerahContract.SelectDTO[]>([])
    const form = useForm<SyncJobContract.CreateDTO>({
        resolver: zodResolver(SyncJobContract.create),
        defaultValues: DEFAULT_VALUES,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "item" as never,
    });

    const getPerangkatDaerah = async () => {
        try {
            const res = await actionGetListPerangkatDaerahByJabatan(PerangkatDaerahJabatan.PENGGUNA);
            if (!res.success) throw res.error;
            setPerangkatDaerah(res.data)
        } catch (e: any) {
            toast.danger(e.message)
        }
    }
    useEffect(() => { getPerangkatDaerah() }, [])
    const onSubmit = form.handleSubmit(
        async (data) => {
            try {
                console.log(data)
                const result = await createSyncJob(data);

                if (!result?.success) {
                    throw new Error("Gagal menambahkan data baru. " + result.error.message);
                }

                toast.success("Sync job berhasil dibuat");
                form.reset(DEFAULT_VALUES);
                onSuccess();
            } catch (error: any) {
                toast.danger(error.message);
            }
        },
        (errors) => {
            console.log(errors);
            toast.danger("Input data tidak valid, silakan periksa kembali");
        }
    );

    const state = useOverlayState();
    return (
        <>
            <Button variant="primary" onPress={() => state.open()}><Plus /> Sync Job Baru</Button>
            <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>Buat Sync Job Baru</Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-4">
                            {/* Nama */}
                            <Controller
                                control={form.control}
                                name="name"
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-1">
                                        <TextField className="w-full max-w-64" name="name" type="text">
                                            <Label htmlFor="name">Nama</Label>
                                            <Input placeholder="Enter your email" value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur} />
                                        </TextField>
                                        {fieldState.error && (
                                            <Description className="text-danger-600">
                                                {fieldState.error.message}
                                            </Description>
                                        )}
                                    </div>
                                )}
                            />

                            {/* Job Type — fixed to "ebmd" for now, shown read-only */}
                            <Controller
                                control={form.control}
                                name="jobType"
                                render={({ field }) => (
                                    <Select
                                        key={field.value}
                                        onChange={(key) => field.onChange(String(key))}
                                        isDisabled={JOB_TYPE_OPTIONS.length <= 1}
                                    >
                                        <Label>Tipe Job</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                {JOB_TYPE_OPTIONS.map((opt) => (
                                                    <ListBox.Item key={opt.key} id={opt.key}>
                                                        <Label>{opt.label}</Label>
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                ))}
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="lokasi"
                                render={({ field }) => (
                                    <Autocomplete
                                        selectionMode="multiple"
                                        // keys={field.value}
                                        onChange={(keys) => {
                                            const selected = Array.from(keys).map(k => String(k));
                                            field.onChange(selected);
                                        }}
                                    >
                                        <Label>Lokasi</Label>
                                        <Autocomplete.Trigger>
                                            <Autocomplete.Value />
                                            <Autocomplete.ClearButton />
                                            <Autocomplete.Indicator />
                                        </Autocomplete.Trigger>
                                        <Description />
                                        <Autocomplete.Popover>
                                            <Autocomplete.Filter>
                                                <SearchField>
                                                    <SearchField.Group>
                                                        <SearchField.SearchIcon />
                                                        <SearchField.Input />
                                                    </SearchField.Group>
                                                </SearchField>
                                                <ListBox>
                                                    {
                                                        perangkatDaerah.map((item) =>
                                                            <ListBox.Item key={item.kodeLokasi} id={item.kodeLokasi} textValue={item.namaLokasi}>
                                                                <Label>{item.namaLokasi}</Label>
                                                                <ListBox.ItemIndicator />
                                                            </ListBox.Item>
                                                        )
                                                    }
                                                </ListBox>
                                            </Autocomplete.Filter>
                                        </Autocomplete.Popover>
                                    </Autocomplete>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="assetType"
                                render={({ field }) => (
                                    <Autocomplete
                                        selectionMode="multiple"
                                        // keys={field.value}
                                        onChange={(keys) => {
                                            const selected = Array.from(keys).map(k => String(k));
                                            field.onChange(selected);
                                        }}
                                    >
                                        <Label>Jenis Aset</Label>
                                        <Autocomplete.Trigger>
                                            <Autocomplete.Value />
                                            <Autocomplete.ClearButton />
                                            <Autocomplete.Indicator />
                                        </Autocomplete.Trigger>
                                        <Description />
                                        <Autocomplete.Popover>
                                            <Autocomplete.Filter>
                                                <SearchField>
                                                    <SearchField.Group>
                                                        <SearchField.SearchIcon />
                                                        <SearchField.Input />
                                                    </SearchField.Group>
                                                </SearchField>
                                                <ListBox>
                                                    {
                                                        Object.values(BmdAssetType).map((item) =>
                                                            <ListBox.Item key={item} id={item} textValue={item}>
                                                                <Label>{item}</Label>
                                                                <ListBox.ItemIndicator />
                                                            </ListBox.Item>
                                                        )
                                                    }
                                                </ListBox>
                                            </Autocomplete.Filter>
                                        </Autocomplete.Popover>
                                    </Autocomplete>
                                )}
                            />

                        </Modal.Body>

                        <Modal.Footer>
                            <Button slot="close" variant="ghost">
                                Batal
                            </Button>
                            <Button variant="primary" onClick={onSubmit} >
                                Tambah Job
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container >
            </Modal.Backdrop >
        </>
    );
}