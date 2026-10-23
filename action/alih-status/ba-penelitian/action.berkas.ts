"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBAPenelitianService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusBAPenelitianContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusBAPenelitian(
    baPenelitianId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusBAPenelitianService.generatePresignedUrlBerkas(session.user.id, baPenelitianId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusBAPenelitian");
    }
}

export async function actionUpdateBerkasAlihStatusBAPenelitian(
    baPenelitianId: number,
    key: string,
): Promise<ActionResponse<AlihStatusBAPenelitianContract.ResultAddBerkasDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusBAPenelitianService.updateBerkas(session.user.id, baPenelitianId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusBAPenelitian");
    }
}

export async function actionGetPreviewUrlBerkasAlihStatusBAPenelitian(
    baPenelitianId: number,
): Promise<ActionResponse<string>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusBAPenelitianService.getPreviewUrlBerkas(session.user.id, baPenelitianId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusBAPenelitian");
    }
}

export async function actionDeleteBerkasAlihStatusBAPenelitian(
    baPenelitianId: number,
): Promise<ActionResponse<void>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusBAPenelitianService.deleteBerkas(session.user.id, baPenelitianId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusBAPenelitian");
    }
}