"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSPKMBContract } from "./contract";
import { AlihStatusSpkmbService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusSpkmb(
    input: AlihStatusSPKMBContract.CreateDTO,
): Promise<ActionResponse<AlihStatusSPKMBContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSPKMBContract.create.parse(input);
        const res = await AlihStatusSpkmbService.insert(session.user.id, validated);


        return {
            success: true,
            data: res,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusSpkmb");
    }
}
