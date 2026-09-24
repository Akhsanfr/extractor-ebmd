"use client";

import { ReactNode, ComponentProps } from "react";
import { useForm, UseFormReturn, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Modal, Button, toast } from "@heroui/react";

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan"): string {
    return error instanceof Error ? error.message : fallback;
}

type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: unknown };

/**
 * Generic create/edit modal shell.
 *
 * This component owns: form state (react-hook-form + zod), the create/edit
 * submit branch, toast feedback, and modal chrome (header/body/footer,
 * open/close). It deliberately knows nothing about which fields exist —
 * the caller supplies field markup via `children`, a render-prop that
 * receives the live `form` instance, so any future entity (surat, aset,
 * pegawai, ...) can reuse this shell with a completely different set of
 * fields without touching this file.
 *
 * Usage:
 *   <EntityFormModal<MyContract.CreateDTO>
 *     target={editTarget}
 *     defaultValues={{ ... }}
 *     fixedValues={{ groupId }}   // values the form can't override
 *     schema={MyContract.create}
 *     createAction={actionCreate}
 *     editAction={actionEdit}
 *     ...
 *   >
 *     {(form) => (
 *       <>
 *         <TextFormField control={form.control} errors={form.formState.errors} name="fieldA" label="Field A" />
 *         <MyCustomPicker control={form.control} name="fieldB" />
 *       </>
 *     )}
 *   </EntityFormModal>
 */
export function EntityFormModal<TValues extends FieldValues>({
    target,
    defaultValues,
    fixedValues,
    schema,
    createAction,
    editAction,
    label,
    onSuccess,
    onClose,
    children,
    containerSize,
    bodyClassName = "flex flex-col gap-4",
    formatValue
}: {
    /** null = create mode. An object (must include `id`) = edit mode. */
    target: (TValues & { id: number }) | null;
    /** Initial values for the editable fields. */
    defaultValues: TValues;
    /**
     * Values injected from context (e.g. `groupId`) that are never rendered
     * as an editable field. Applied both as part of the initial values and
     * re-applied at submit time, so a stale or tampered form value can never
     * override them.
     */
    fixedValues?: Partial<TValues>;
    schema: ZodType<TValues>;
    createAction: (values: TValues) => Promise<ActionResponse<unknown>>;
    editAction: (values: TValues & { id: number }) => Promise<ActionResponse<unknown>>;
    label: string;
    onClose: () => void | Promise<void>;
    /** Field markup. Receives the react-hook-form instance to wire up inputs. */
    children: (form: UseFormReturn<TValues>) => ReactNode;
    /** `Modal.Container` size — e.g. "sm" | "lg" | "cover". Forms with many fields want "lg". */
    containerSize?: ComponentProps<typeof Modal.Container>["size"];
    /**
     * ClassName for `Modal.Body`. Defaults to a single-column stack; pass a
     * grid class (e.g. "grid grid-cols-12 gap-2") for forms whose fields
     * need to lay out side by side.
     */
    bodyClassName?: string;
    onSuccess?: (data: unknown) => Promise<void>;
    formatValue?: (data: TValues) => TValues
}) {
    const isEdit = target !== null;

    const form = useForm<TValues>({
        resolver: zodResolver(schema as any),
        defaultValues: {
            ...defaultValues,
            ...(target ?? {}),
            ...fixedValues,
        } as never,
    });

    const onSubmit = async (values: TValues) => {
        try {
            const merged = {
                ...values,
                ...fixedValues,
            } as TValues;

            const payload = formatValue ? formatValue(merged) : merged;

            const result = isEdit
                ? await editAction({ ...payload, id: target.id })
                : await createAction(payload);

            if (!result.success) throw result.error;
            toast.success(label + (isEdit ? " berhasil diupdate" : " berhasil ditambahkan"), {
                description: result.message,
            });
            await onSuccess?.(result.data);
            await onClose();
        } catch (error) {
            toast.danger(label + (isEdit ? " gagal diupdate" : " gagal ditambahkan"), { description: getErrorMessage(error) });
        }
    };

    const onError = (formErrors: unknown) => {
        toast.danger("Gagal submit form", { description: JSON.stringify(formErrors) });
    };

    return (
        <Modal isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal.Backdrop>
                <Modal.Container size={containerSize}>
                    <Modal.Dialog>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
                            <Modal.CloseTrigger onPress={onClose} />
                            <Modal.Header>
                                <Modal.Heading>{isEdit ? label + " Edit" : label + "Tambah"}</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className={bodyClassName}>
                                {children(form)}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onPress={onClose}>
                                    Batal
                                </Button>
                                <Button type="submit">
                                    Simpan
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}