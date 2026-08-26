"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSpkmbContract } from "./contract";
import { AlihStatusSpkmbService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetAlihStatusSpkmbByMasterId(masterId: number): Promise<
    ActionResponse<AlihStatusSpkmbContract.SelectDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusSpkmbService.getByMasterId(session.user.id, masterId);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusSpkmb");
    }
}
