"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusNodinService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusNodinContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusNodin(
    nodinId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusNodinService.generatePresignedUrlBerkas(session.user.id, nodinId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusNodin");
    }
}

export async function actionUpdateBerkasAlihStatusNodin(
    nodinId: number,
    key: string,
): Promise<ActionResponse<AlihStatusNodinContract.ResultAddBerkasDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusNodinService.updateBerkas(session.user.id, nodinId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusNodin");
    }
}

export async function actionGetPreviewUrlBerkasAlihStatusNodin(
    nodinId: number,
): Promise<ActionResponse<string>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusNodinService.getPreviewUrlBerkas(session.user.id, nodinId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusNodin");
    }
}

export async function actionDeleteBerkasAlihStatusNodin(
    nodinId: number,
): Promise<ActionResponse<void>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusNodinService.deleteBerkas(session.user.id, nodinId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusNodin");
    }
}