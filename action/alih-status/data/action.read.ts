"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusDataContract } from "./contract";
import { AlihStatusDataService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusDataByPermohonanId(permohonanId: number): Promise<
    ActionResponse<AlihStatusDataContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusDataService.getListByPermohonanId(session.user.id, permohonanId);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusDataByPermohonanId");
    }
}

export async function actionGetListAlihStatusData(query: AlihStatusDataContract.QueryDTO): Promise<
    ActionResponse<AlihStatusDataContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusDataService.getListData(session.user.id, query);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusData");
    }
}