"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusMasterContract } from "./contract";
import { AlihStatusMasterService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusMaster(
    input: AlihStatusMasterContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusMasterContract.edit.parse(input);

        await AlihStatusMasterService.update(validated, session.user.id);

        return {
            success: true,
            data: undefined,
            message: "Apbd periode berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditApbdPeriode");
    }
}
