"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSKHapusContract } from "./contract";
import { AlihStatusSKHapusService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusSKHapus(
    input: AlihStatusSKHapusContract.CreateDTO,
): Promise<ActionResponse<AlihStatusSKHapusContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSKHapusContract.create.parse(input);


        return {
            success: true,
            data: await AlihStatusSKHapusService.insert(validated, session.user.id),
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusSKHapus");
    }
}
