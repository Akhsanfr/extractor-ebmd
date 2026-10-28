"use server";
// -> src/action/rekon/action.berkas.ts
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { auth } from "@/lib/auth/auth";
import { RekonContract } from "./contract";
import { RekonBerkasService } from "./service.berkas";

type Tipe = RekonContract.BerkasTipe;

// `id` dan `tipe` datang dari klien, jadi keduanya divalidasi ulang di server.
// Key storage TIDAK pernah diterima untuk operasi hapus/preview/unduh: key selalu dibaca dari DB.
async function requireUserId(): Promise<string> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
    return session.user.id;
}

export async function actionGetPresignedUrlBerkasRekon(
    rekonId: number,
    tipe: Tipe,
): Promise<ActionResponse<{ url: string; key: string }>> {
    try {
        // const userId = await requireUserId();
        const input = RekonContract.berkasTarget.parse({ id: rekonId, tipe });
        const result = await RekonBerkasService.generatePresignedUrl(input);
        return { success: true, data: result, message: "URL upload berkas berhasil dibuat." };
    } catch (err) {
        return handleActionError(err, "actionGetPresignedUrlBerkasRekon");
    }
}

export async function actionUpdateBerkasRekon(
    rekonId: number,
    tipe: Tipe,
    key: string,
): Promise<ActionResponse<RekonContract.ResultBerkasDTO>> {
    try {
        // const userId = await requireUserId();
        const input = RekonContract.updateBerkas.parse({ id: rekonId, tipe, key });
        const result = await RekonBerkasService.updateBerkas(input);
        return { success: true, data: result, message: "Berkas berhasil disimpan." };
    } catch (err) {
        return handleActionError(err, "actionUpdateBerkasRekon");
    }
}

export async function actionGetPreviewUrlBerkasRekon(
    rekonId: number,
    tipe: Tipe,
): Promise<ActionResponse<string>> {
    try {
        // const userId = await requireUserId();
        const input = RekonContract.berkasTarget.parse({ id: rekonId, tipe });
        const result = await RekonBerkasService.getPreviewUrl(input);
        return { success: true, data: result, message: "URL preview berkas berhasil dibuat." };
    } catch (err) {
        return handleActionError(err, "actionGetPreviewUrlBerkasRekon");
    }
}

export async function actionGetDownloadUrlBerkasRekon(
    rekonId: number,
    tipe: Tipe,
): Promise<ActionResponse<string>> {
    try {
        // const userId = await requireUserId();
        const input = RekonContract.berkasTarget.parse({ id: rekonId, tipe });
        const result = await RekonBerkasService.getDownloadUrl(input);
        return { success: true, data: result, message: "URL unduhan berkas berhasil dibuat." };
    } catch (err) {
        return handleActionError(err, "actionGetDownloadUrlBerkasRekon");
    }
}

export async function actionDeleteBerkasRekon(
    rekonId: number,
    tipe: Tipe,
): Promise<ActionResponse<void>> {
    try {
        // const userId = await requireUserId();
        const input = RekonContract.berkasTarget.parse({ id: rekonId, tipe });
        await RekonBerkasService.deleteBerkas(input);
        return { success: true, data: undefined, message: "Berkas berhasil dihapus." };
    } catch (err) {
        return handleActionError(err, "actionDeleteBerkasRekon");
    }
}