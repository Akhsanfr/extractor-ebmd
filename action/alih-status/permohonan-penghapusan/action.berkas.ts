"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusPermohonanPenghapusan(
    permohonanPenghapusanId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPermohonanPenghapusanService.generatePresignedUrlBerkas(session.user.id, permohonanPenghapusanId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusPermohonanPenghapusan");
    }
}

export async function actionUpdateBerkasAlihStatusPermohonanPenghapusan(
    permohonanPenghapusanId: number,
    key: string,
): Promise<ActionResponse<AlihStatusPermohonanPenghapusanContract.ResultAddBerkasDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPermohonanPenghapusanService.updateBerkas(session.user.id, permohonanPenghapusanId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusPermohonanPenghapusan");
    }
}

export async function actionGetPreviewUrlBerkasAlihStatusPermohonanPenghapusan(
    permohonanPenghapusanId: number,
): Promise<ActionResponse<string>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPermohonanPenghapusanService.getPreviewUrlBerkas(session.user.id, permohonanPenghapusanId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusPermohonanPenghapusan");
    }
}

export async function actionDeleteBerkasAlihStatusPermohonanPenghapusan(
    permohonanPenghapusanId: number,
): Promise<ActionResponse<void>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusPermohonanPenghapusanService.deleteBerkas(session.user.id, permohonanPenghapusanId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusPermohonanPenghapusan");
    }
}