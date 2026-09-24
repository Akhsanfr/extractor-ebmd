"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSKHapusContract } from "./contract";
import { AlihStatusSKHapusService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusSKHapus(tahun: number): Promise<
    ActionResponse<AlihStatusSKHapusContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusSKHapusService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusSKHapus");
    }
}
export async function actionGetListSKHapusWithDetail(id: number): Promise<
    ActionResponse<AlihStatusSKHapusContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusSKHapusService.getDetailWithDetail(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListSKHapusWithDetail");
    }
}
