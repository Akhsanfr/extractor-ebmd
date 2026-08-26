"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanContract } from "./contract";
import { AlihStatusPermohonanService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusPermohonan(
    input: AlihStatusPermohonanContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanContract.edit.parse(input);

        await AlihStatusPermohonanService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/permohonan");

        return {
            success: true,
            data: undefined,
            message: "Permohonan alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPermohonan");
    }
}
