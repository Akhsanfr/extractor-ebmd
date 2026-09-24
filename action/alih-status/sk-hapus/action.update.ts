"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSKHapusContract } from "./contract";
import { AlihStatusSKHapusService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusSKHapus(
    input: AlihStatusSKHapusContract.EditDTO,
): Promise<ActionResponse<AlihStatusSKHapusContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSKHapusContract.edit.parse(input);

        return {
            success: true,
            data: await AlihStatusSKHapusService.update(validated, session.user.id),
            message: "Persetujuan SKHapus alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPersetujuanSKHapus");
    }
}
