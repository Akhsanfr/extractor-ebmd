"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanContract } from "./contract";
import { AlihStatusPermohonanService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetDetailAlihStatusPermohonan(id: number): Promise<
    ActionResponse<AlihStatusPermohonanContract.SelectDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanService.get(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetAlihStatusPermohonan");
    }
}
export async function actionGetListAlihStatusPermohonan(tahun: number): Promise<
    ActionResponse<AlihStatusPermohonanContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPermohonan");
    }
}

export async function actionGetDetailAlihStatusPermohonanWithDetail(permohonanId: number): Promise<
    ActionResponse<AlihStatusPermohonanContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanService.getWithDetail(session.user.id, permohonanId);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetPermohonanWithDetail");
    }
}
export async function actionGetListAlihStatusPermohonanForAvailableBAPenelitian(tahun: number): Promise<
    ActionResponse<AlihStatusPermohonanContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanService.getForAvailableBAPenelitian(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetPermohonanWithDetail");
    }
}
