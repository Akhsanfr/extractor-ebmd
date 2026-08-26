"use server";

import { headers } from "next/headers";
import { AlihStatusSKHapusService } from "./service";
import { AlihStatusSKHapusContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusSKHapus(
    input: AlihStatusSKHapusContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSKHapusContract.delete.parse(input);
        await AlihStatusSKHapusService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/sk-hapus");

        return {
            success: true,
            data: undefined,
            message: "SK hapus alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusSKHapus");
    }
}
