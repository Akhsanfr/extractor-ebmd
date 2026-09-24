"use server";

import { headers } from "next/headers";
import { AlihStatusSpkmbService } from "./service";
import { AlihStatusSPKMBContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusSpkmb(
    input: AlihStatusSPKMBContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSPKMBContract.delete.parse(input);
        await AlihStatusSpkmbService.remove(validated, session.user.id);

        return {
            success: true,
            data: undefined,
            message: "SPKMB alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusSpkmb");
    }
}
