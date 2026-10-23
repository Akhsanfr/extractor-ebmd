"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusPersetujuanBupatiContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusPersetujuanBupati(
    persetujuanBupatiId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPersetujuanBupatiService.generatePresignedUrlBerkas(session.user.id, persetujuanBupatiId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusPersetujuanBupati");
    }
}

export async function actionUpdateBerkasAlihStatusPersetujuanBupati(
    persetujuanBupatiId: number,
    key: string,
): Promise<ActionResponse<AlihStatusPersetujuanBupatiContract.ResultAddBerkasDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPersetujuanBupatiService.updateBerkas(session.user.id, persetujuanBupatiId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusPersetujuanBupati");
    }
}

export async function actionGetPreviewUrlBerkasAlihStatusPersetujuanBupati(
    persetujuanBupatiId: number,
): Promise<ActionResponse<string>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusPersetujuanBupatiService.getPreviewUrlBerkas(session.user.id, persetujuanBupatiId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusPersetujuanBupati");
    }
}

export async function actionDeleteBerkasAlihStatusPersetujuanBupati(
    persetujuanBupatiId: number,
): Promise<ActionResponse<void>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusPersetujuanBupatiService.deleteBerkas(session.user.id, persetujuanBupatiId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusPersetujuanBupati");
    }
}