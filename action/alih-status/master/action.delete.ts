"use server";

import { headers } from "next/headers";
import { AlihStatusMasterService } from "./service";
import { AlihStatusMasterContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";

export async function actionDeleteAlihStatusMaster(
    input: AlihStatusMasterContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusMasterContract.delete.parse(input);
        await AlihStatusMasterService.remove(validated, session.user.id);

        return {
            success: true,
            data: undefined,
            message: "Apbd periode berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusMaster");
    }
}
