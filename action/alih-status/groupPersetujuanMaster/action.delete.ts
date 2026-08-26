"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AlihStatusGroupPersetujuanMasterService } from "./service";
import { AlihStatusGroupPersetujuanMasterContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";

export async function actionDeleteAlihStatusGroupPersetujuanMasterByMasterId(
    input: AlihStatusGroupPersetujuanMasterContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusGroupPersetujuanMasterContract.deleteByMasterId.parse(input);
        await AlihStatusGroupPersetujuanMasterService.removeByMasterId(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/group");

        return {
            success: true,
            data: undefined,
            message: "Relasi master-group alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusGroupPersetujuanMasterByMasterId");
    }
}
