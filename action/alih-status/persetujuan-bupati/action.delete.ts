"use server";

import { headers } from "next/headers";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusPersetujuanBupati(
    input: AlihStatusPersetujuanBupatiContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPersetujuanBupatiContract.delete.parse(input);
        await AlihStatusPersetujuanBupatiService.remove(validated, session.user.id);
        return {
            success: true,
            data: undefined,
            message: "Persetujuan bupati alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusPersetujuanBupati");
    }
}
