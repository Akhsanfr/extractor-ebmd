"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusGroupPersetujuanMasterContract } from "./contract";
import { AlihStatusGroupPersetujuanMasterService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusGroupPersetujuanMaster(): Promise<
    ActionResponse<AlihStatusGroupPersetujuanMasterContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusGroupPersetujuanMasterService.getList(session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusGroupMaster");
    }
}
