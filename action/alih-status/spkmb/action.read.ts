"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSPKMBContract } from "./contract";
import { AlihStatusSpkmbService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusSpkmbByIds(ids: number[]): Promise<
    ActionResponse<AlihStatusSPKMBContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusSpkmbService.getList(session.user.id, ids);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusSpkmb");
    }
}
