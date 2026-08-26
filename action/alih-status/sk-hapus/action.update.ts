"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSKHapusContract } from "./contract";
import { AlihStatusSKHapusService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusSKHapus(
    input: AlihStatusSKHapusContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSKHapusContract.edit.parse(input);

        await AlihStatusSKHapusService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/sk-hapus");

        return {
            success: true,
            data: undefined,
            message: "SK hapus alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusSKHapus");
    }
}
