"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusGroupPersetujuanContract } from "./contract";
import { AlihStatusGroupPersetujuanService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { AlihStatusMasterContract } from "../master/contract";

export async function actionGetListAlihStatusGroupPersetujuan(): Promise<
    ActionResponse<AlihStatusGroupPersetujuanContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusGroupPersetujuanService.getList(session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusGroup");
    }
}

export async function actionGetListMasterWithSumDataByGroupPersetujuan(groupId: number): Promise<
    ActionResponse<AlihStatusMasterContract.SelectWithSumDataDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusGroupPersetujuanService.getListMasterWithSumDataByGroupPersetujuan(session.user.id, groupId);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusGroup");
    }
}


export async function actionGetDetailAlihStatusGroupPersetujuan(id: number): Promise<
    ActionResponse<AlihStatusGroupPersetujuanContract.SelectDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusGroupPersetujuanService.getById(id, session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetDetailAlihStatusGroup");
    }
}
