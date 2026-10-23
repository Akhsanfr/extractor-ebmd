"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTService } from "./service";
import { auth } from "@/lib/auth/auth";
import { AlihStatusBASTContract } from "./contract";

export async function actionGetPresignedUrlBerkasAlihStatusBAST(
    bastId: number,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusBASTService.generatePresignedUrlBerkas(session.user.id, bastId);
        return {
            success: true,
            data: result,
            message: "URL upload berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasAlihStatusBAST");
    }
}

export async function actionUpdateBerkasAlihStatusBAST(
    bastId: number,
    key: string,
): Promise<ActionResponse<AlihStatusBASTContract.ResultAddBerkasDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusBASTService.updateBerkas(session.user.id, bastId, key);
        return {
            success: true,
            data: result,
            message: "Berkas berhasil disimpan.",
        };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasAlihStatusBAST");
    }
}

export async function actionGetPreviewUrlBerkasAlihStatusBAST(
    bastId: number,
): Promise<ActionResponse<string>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const result = await AlihStatusBASTService.getPreviewUrlBerkas(session.user.id, bastId);
        return {
            success: true,
            data: result,
            message: "URL preview berkas berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasAlihStatusBAST");
    }
}

export async function actionDeleteBerkasAlihStatusBAST(
    bastId: number,
): Promise<ActionResponse<void>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        await AlihStatusBASTService.deleteBerkas(session.user.id, bastId);
        return {
            success: true,
            data: undefined,
            message: "Berkas berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasAlihStatusBAST");
    }
}