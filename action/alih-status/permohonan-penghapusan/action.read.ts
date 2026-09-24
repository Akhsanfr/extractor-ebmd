"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusPermohonanPenghapusan(tahun: number): Promise<
    ActionResponse<AlihStatusPermohonanPenghapusanContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanPenghapusanService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPermohonanPenghapusan");
    }
}
export async function actionGetListPermohonanPenghapusanWithDetail(id: number): Promise<
    ActionResponse<AlihStatusPermohonanPenghapusanContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanPenghapusanService.getDetailWithDetail(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListPermohonanPenghapusanWithDetail");
    }
}
export async function actionGetListAlihStatusPermohonanPenghapusanForAvailableSKHapus(tahun: number): Promise<
    ActionResponse<AlihStatusPermohonanPenghapusanContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        return {
            success: true,
            data: await AlihStatusPermohonanPenghapusanService.getForAvailablePermohonanPenghapusan(session.user.id, tahun),
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPermohonanPenghapusanForAvailablePermohonanPenghapusan");
    }
}

