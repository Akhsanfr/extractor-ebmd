"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusTrackingContract } from "./contract";
import { AlihStatusTrackingService } from "./service";
import { auth } from "@/lib/auth/auth";


export async function actionGetAlihStatusTrackingBySource(query: AlihStatusTrackingContract.QueryDTO): Promise<ActionResponse<AlihStatusTrackingContract.SelectDTO[]>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");

        AlihStatusTrackingContract.query.parse(query);
        const res = await AlihStatusTrackingService.getBySource(
            session.user.id,
            query
        );
        return {
            success: true,
            data: res,
        };
    } catch (err) {
        return handleActionError(err, "actionGetAlihStatusTrackingBySource");
    }
}
