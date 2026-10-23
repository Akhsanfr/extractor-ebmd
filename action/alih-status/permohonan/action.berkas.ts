"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusPermohonanContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusPermohonan(
    permohonanId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPermohonanService.generatePresignedUrlBerkas(session.user.id, permohonanId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusPermohonan");
    }
}
export async function actionUpdateBerkasAlihStatusPermohonan(
    permohonanId: number,
    key: string,
): Promise<ActionResponse<AlihStatusPermohonanContract.ResultAddBerkasDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPermohonanService.updateBerkas(session.user.id, permohonanId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusPermohonan");
    }
}
export async function actionGetPreviewUrlBerkasAlihStatusPermohonan(
    permohonanId: number,
): Promise<ActionResponse<string>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPermohonanService.getPreviewUrlBerkas(session.user.id, permohonanId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusPermohonan");
    }
}

export async function actionDeleteBerkasAlihStatusPermohonan(
    permohonanId: number,
): Promise<ActionResponse<void>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusPermohonanService.deleteBerkas(session.user.id, permohonanId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusPermohonan");
    }
}
