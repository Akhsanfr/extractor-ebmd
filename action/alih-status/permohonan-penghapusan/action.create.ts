"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { AlihStatusPermohonanPenghapusanService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusPermohonanPenghapusan(
    input: AlihStatusPermohonanPenghapusanContract.CreateDTO,
): Promise<ActionResponse<AlihStatusPermohonanPenghapusanContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanPenghapusanContract.create.parse(input);


        return {
            success: true,
            data: await AlihStatusPermohonanPenghapusanService.insert(validated, session.user.id),
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusPermohonanPenghapusan");
    }
}
