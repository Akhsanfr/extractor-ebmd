"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusTrackingContract } from "./contract";
import { AlihStatusTrackingService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusTracking(
    input: AlihStatusTrackingContract.CreateDTO,
): Promise<ActionResponse<AlihStatusTrackingContract.SelectDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");

        const validated = AlihStatusTrackingContract.create.parse(input);
        const res = await AlihStatusTrackingService.insert(session.user.id, validated);

        return {
            success: true,
            data: res,
            message: "Tracking alih status berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusTracking");
    }
}
