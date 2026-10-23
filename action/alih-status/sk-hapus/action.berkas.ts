"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSKHapusService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusSKHapusContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusSKHapus(
    skHapusId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusSKHapusService.generatePresignedUrlBerkas(session.user.id, skHapusId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusSKHapus");
    }
}

export async function actionUpdateBerkasAlihStatusSKHapus(
    skHapusId: number,
    key: string,
): Promise<ActionResponse<AlihStatusSKHapusContract.ResultAddBerkasDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusSKHapusService.updateBerkas(session.user.id, skHapusId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusSKHapus");
    }
}

export async function actionGetPreviewUrlBerkasAlihStatusSKHapus(
    skHapusId: number,
): Promise<ActionResponse<string>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusSKHapusService.getPreviewUrlBerkas(session.user.id, skHapusId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusSKHapus");
    }
}

export async function actionDeleteBerkasAlihStatusSKHapus(
    skHapusId: number,
): Promise<ActionResponse<void>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusSKHapusService.deleteBerkas(session.user.id, skHapusId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusSKHapus");
    }
}