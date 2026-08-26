"use server";

import { headers } from "next/headers";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusPermohonanPenghapusan(
    input: AlihStatusPermohonanPenghapusanContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanPenghapusanContract.delete.parse(input);
        await AlihStatusPermohonanPenghapusanService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/permohonan-penghapusan");

        return {
            success: true,
            data: undefined,
            message: "Permohonan penghapusan alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusPermohonanPenghapusan");
    }
}
