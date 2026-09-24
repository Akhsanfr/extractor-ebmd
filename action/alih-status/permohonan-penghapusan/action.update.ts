"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusPermohonanPenghapusan(
    input: AlihStatusPermohonanPenghapusanContract.EditDTO,
): Promise<ActionResponse<AlihStatusPermohonanPenghapusanContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanPenghapusanContract.edit.parse(input);

        return {
            success: true,
            data: await AlihStatusPermohonanPenghapusanService.update(validated, session.user.id),
            message: "Persetujuan PermohonanPenghapusan alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPersetujuanPermohonanPenghapusan");
    }
}
