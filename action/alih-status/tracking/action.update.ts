"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusTrackingContract } from "./contract";
import { AlihStatusTrackingService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusTracking(
    input: AlihStatusTrackingContract.EditDTO,
): Promise<ActionResponse<AlihStatusTrackingContract.SelectDTO>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");

        const validated = AlihStatusTrackingContract.edit.parse(input);
        const res = await AlihStatusTrackingService.update(validated, session.user.id);

        return {
            success: true,
            data: res,
            message: "Tracking alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusTracking");
    }
}
