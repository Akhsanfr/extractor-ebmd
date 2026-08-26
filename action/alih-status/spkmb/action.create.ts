"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusSpkmbContract } from "./contract";
import { AlihStatusSpkmbService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusSpkmb(
    input: AlihStatusSpkmbContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusSpkmbContract.create.parse(input);
        await AlihStatusSpkmbService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/spkmb");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusSpkmb");
    }
}
