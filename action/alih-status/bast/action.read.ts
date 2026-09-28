"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTContract } from "./contract";
import { AlihStatusBASTService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusBAST(tahun: number): Promise<
    ActionResponse<AlihStatusBASTContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusBASTService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusBAST");
    }
}
export async function actionGetListBASTWithDetail(id: number): Promise<
    ActionResponse<AlihStatusBASTContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusBASTService.getDetailWithDetail(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListBASTWithDetail");
    }
}
export async function actionGetListAlihStatusBASTForAvailablePermohonanPenghapusan(tahun: number): Promise<
    ActionResponse<AlihStatusBASTContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        return {
            success: true,
            data: await AlihStatusBASTService.getForAvailablePermohonanPenghapusan(session.user.id, tahun),
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusBASTForAvailablePermohonanPenghapusan");
    }
}
export async function actionGetListPenggunaBarangForBAST(permohonanId: number, spkmbId: number): Promise<
    ActionResponse<AlihStatusBASTContract.PenggunaBarangDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusBASTService.getPenggunaBarang(session.user.id, permohonanId, spkmbId);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListPenggunaBarangForBAST");
    }
}