"use server";

import { headers } from "next/headers";
import { AlihStatusPermohonanService } from "./service";
import { AlihStatusPermohonanContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusPermohonan(
    input: AlihStatusPermohonanContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanContract.delete.parse(input);
        await AlihStatusPermohonanService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/permohonan");

        return {
            success: true,
            data: undefined,
            message: "Permohonan alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusPermohonan");
    }
}
