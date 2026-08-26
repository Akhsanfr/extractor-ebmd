"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanContract } from "./contract";
import { AlihStatusPermohonanService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusPermohonanByMasterId(masterId: number): Promise<
    ActionResponse<AlihStatusPermohonanContract.SelectDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPermohonanService.getByMasterId(session.user.id, masterId);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPermohonan");
    }
}
