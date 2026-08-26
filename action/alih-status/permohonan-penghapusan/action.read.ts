"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusPermohonanPenghapusan(): Promise<
    ActionResponse<AlihStatusPermohonanPenghapusanContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanPenghapusanService.getList(session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPermohonanPenghapusan");
    }
}
