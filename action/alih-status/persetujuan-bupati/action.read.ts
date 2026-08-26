"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetDetailAlihStatusPersetujuanBupati(groupId: number): Promise<
    ActionResponse<AlihStatusPersetujuanBupatiContract.SelectDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPersetujuanBupatiService.getByGroupId(groupId, session.user.id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPersetujuanBupati");
    }
}
