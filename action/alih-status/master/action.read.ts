"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusMasterContract } from "./contract";
import { AlihStatusMasterService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusMaster(): Promise<
    ActionResponse<AlihStatusMasterContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusMasterService.getList(session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusMaster");
    }
}

export async function actionGetListMasterWithoutPersetujuan(): Promise<
    ActionResponse<AlihStatusMasterContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusMasterService.getListMasterWithoutPersetujuan(session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListMasterWithoutPersetujuan");
    }
}

export async function actionGetListAlihStatusMasterWithSumData(): Promise<
    ActionResponse<AlihStatusMasterContract.SelectWithSumDataDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusMasterService.getListWithSumData(session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusMasterWithSumData");
    }
}

export async function actionGetDetailAlihStatusMaster(id: number): Promise<
    ActionResponse<AlihStatusMasterContract.SelectDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusMasterService.getById(id, session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetDetailAlihStatusMaster");
    }
}