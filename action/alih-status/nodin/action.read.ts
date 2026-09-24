"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusNodinContract } from "./contract";
import { AlihStatusNodinService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusNodin(tahun: number): Promise<
    ActionResponse<AlihStatusNodinContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusNodinService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusNodin");
    }
}
export async function actionGetListNodinWithDetail(id: number): Promise<
    ActionResponse<AlihStatusNodinContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusNodinService.getDetailWithDetail(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListNodinWithDetail");
    }
}
export async function actionGetListAlihStatusBAPenelitianForAvailablePersetujuanBupati(tahun: number): Promise<
    ActionResponse<AlihStatusNodinContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusNodinService.getForAvailablePersetujuanBupati(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusBAPenelitianForAvailableNodin");
    }
}
