"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBAPenelitianContract } from "./contract";
import { AlihStatusBAPenelitianService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusBAPenelitian(tahun: number): Promise<
    ActionResponse<AlihStatusBAPenelitianContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusBAPenelitianService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusBAPenelitian");
    }
}
export async function actionGetListBAPenelitianWithDetail(id: number): Promise<
    ActionResponse<AlihStatusBAPenelitianContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusBAPenelitianService.getDetailWithDetail(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListBAPenelitianWithDetail");
    }
}
export async function actionGetListAlihStatusBAPenelitianForAvailableNodin(tahun: number): Promise<
    ActionResponse<AlihStatusBAPenelitianContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusBAPenelitianService.getForAvailableNodin(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusBAPenelitianForAvailableNodin");
    }
}
