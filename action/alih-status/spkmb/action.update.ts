"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSPKMBContract } from "./contract";
import { AlihStatusSpkmbService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusSpkmb(
    input: AlihStatusSPKMBContract.EditDTO,
): Promise<ActionResponse<AlihStatusSPKMBContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSPKMBContract.edit.parse(input);

        const res = await AlihStatusSpkmbService.update(validated, session.user.id);

        return {
            success: true,
            data: res,
            message: "SPKMB alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusSpkmb");
    }
}
