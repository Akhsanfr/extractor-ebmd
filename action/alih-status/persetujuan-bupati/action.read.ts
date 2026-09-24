"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function actionGetListAlihStatusPersetujuanBupati(tahun: number): Promise<
    ActionResponse<AlihStatusPersetujuanBupatiContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPersetujuanBupatiService.getList(session.user.id, tahun);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPersetujuanBupati");
    }
}
export async function actionGetListPersetujuanBupatiWithDetail(id: number): Promise<
    ActionResponse<AlihStatusPersetujuanBupatiContract.SelectWithDetailDTO>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await AlihStatusPersetujuanBupatiService.getDetailWithDetail(session.user.id, id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListPersetujuanBupatiWithDetail");
    }
}
export async function actionGetListAlihStatusPersetujuanBupatiForAvailableBAST(tahun: number): Promise<
    ActionResponse<AlihStatusPersetujuanBupatiContract.SelectDTO[]>
> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        return {
            success: true,
            data: await AlihStatusPersetujuanBupatiService.getForAvailableBAST(session.user.id, tahun),
        };
    } catch (err) {
        return handleActionError(err, "actionGetListAlihStatusPersetujuanBupatiForAvailableNodin");
    }
}
