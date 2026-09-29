"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Chip } from "@heroui/react";
import Loading from "@/component/loading";
import { AlihStatusTrackingContract } from "@/action/alih-status/tracking/contract";
import { actionCreateAlihStatusTracking } from "@/action/alih-status/tracking/action.create";
import { actionEditAlihStatusTracking } from "@/action/alih-status/tracking/action.update";
import { EntityFormModal } from "./entityFormModal";
import { ComboBoxFormField, TextFormField } from "./formField";
import { AlihStatusTrackingPosition, AlihStatusTrackingSourceType } from "@/enum/alihStatus";

type Props = AlihStatusTrackingContract.QueryDTO & {
    /** data tracking sudah di-fetch oleh parent */
    data: AlihStatusTrackingContract.SelectDTO[];
    isLoading: boolean;
    /** query key milik parent, di-invalidate setelah create/edit berhasil */
    queryKey: unknown[];
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));

export default function AlihStatusTrackingTimeline({
    sourceType,
    sourceId,
    data,
    isLoading,
    queryKey,
}: Props) {
    const queryClient = useQueryClient();

    const [formTarget, setFormTarget] = useState<
        AlihStatusTrackingContract.SelectDTO | null | undefined
    >(undefined); // undefined = closed, null = create, object = edit

    // terbaru di atas: tanggal desc, lalu id desc
    const items = useMemo(
        () => [...(data ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
        [data],
    );

    const onSuccessMutation = async () => {
        await queryClient.invalidateQueries({ queryKey });
        setFormTarget(undefined);
    };

    return (
        <>
            <Card>
                <Card.Header className="flex flex-row items-center justify-between gap-3">
                    <div className="flex flex-col">
                        <Card.Title>Tracking Dokumen</Card.Title>
                        <Card.Description>{sourceType}</Card.Description>
                    </div>
                    <Button variant="primary" size="sm" onPress={() => setFormTarget(null)}>
                        Tambah tracking
                    </Button>
                </Card.Header>

                <Card.Content>
                    {isLoading ? (
                        <Loading />
                    ) : items.length === 0 ? (
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Belum ada riwayat tracking</Alert.Title>
                                <Alert.Description>
                                    Catat posisi dokumen dengan klik tombol tambah di atas
                                </Alert.Description>
                            </Alert.Content>
                        </Alert>
                    ) : (
                        <ol className="flex flex-col">
                            {items.map((item, index) => {
                                const isLatest = index === 0;
                                const isLast = index === items.length - 1;

                                return (
                                    <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                                        {/* garis penghubung */}
                                        {!isLast && (
                                            <span
                                                aria-hidden
                                                className="absolute left-[7px] top-4 h-full w-px bg-border"
                                            />
                                        )}

                                        {/* titik */}
                                        <span
                                            aria-hidden
                                            className={
                                                isLatest
                                                    ? "relative mt-1 size-4 shrink-0 rounded-full bg-accent ring-4 ring-accent/20"
                                                    : "relative mt-1 size-4 shrink-0 rounded-full border-2 border-border bg-surface"
                                            }
                                        />

                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-foreground">
                                                    {item.position}
                                                </span>
                                                {isLatest && (
                                                    <Chip size="sm" color="accent" variant="soft">
                                                        Posisi terkini
                                                    </Chip>
                                                )}
                                            </div>
                                            <time dateTime={item.date} className="text-xs text-muted">
                                                {formatDate(item.date)}
                                            </time>
                                            {item.note && (
                                                <p className="mt-1 whitespace-pre-line text-sm text-muted">
                                                    {item.note}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="self-start"
                                            onPress={() => setFormTarget(item)}
                                        >
                                            Edit
                                        </Button>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </Card.Content>
            </Card>

            {formTarget !== undefined && (
                <EntityFormModal<AlihStatusTrackingContract.CreateDTO>
                    target={
                        formTarget as
                        | (AlihStatusTrackingContract.CreateDTO & { id: number })
                        | null
                    }
                    defaultValues={{
                        sourceType,
                        sourceId,
                        position: formTarget?.position ?? "",
                        date: formTarget?.date ?? "",
                        note: formTarget?.note ?? "",
                    }}
                    // sourceType & sourceId tidak bisa diubah, selalu ikut param component
                    fixedValues={{ sourceType, sourceId }}
                    schema={AlihStatusTrackingContract.create}
                    createAction={actionCreateAlihStatusTracking}
                    editAction={actionEditAlihStatusTracking}
                    label="Tracking Dokumen"
                    onClose={async () => {
                        setFormTarget(undefined);
                    }}
                    onSuccess={onSuccessMutation}
                >
                    {(form) => (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ComboBoxFormField
                                label="Posisi Dokumen"
                                control={form.control}
                                errors={form.formState.errors}
                                name="position"
                                options={Object.values(AlihStatusTrackingPosition)}
                                placeholder="Pilih dari daftar atau ketik manual"
                            />
                            <TextFormField
                                label="Tanggal"
                                type="date"
                                control={form.control}
                                errors={form.formState.errors}
                                name="date"
                            />
                            <div className="sm:col-span-2">
                                <TextFormField
                                    label="Catatan"
                                    control={form.control}
                                    errors={form.formState.errors}
                                    name="note"
                                />
                            </div>
                        </div>
                    )}
                </EntityFormModal>
            )}
        </>
    );
}