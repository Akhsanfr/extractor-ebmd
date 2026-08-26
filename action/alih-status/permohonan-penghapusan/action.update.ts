"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusPermohonanPenghapusan(
    input: AlihStatusPermohonanPenghapusanContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanPenghapusanContract.edit.parse(input);

        await AlihStatusPermohonanPenghapusanService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/permohonan-penghapusan");

        return {
            success: true,
            data: undefined,
            message: "Permohonan penghapusan alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPermohonanPenghapusan");
    }
}
