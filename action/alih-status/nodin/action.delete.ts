"use server";

import { headers } from "next/headers";
import { AlihStatusNodinService } from "./service";
import { AlihStatusNodinContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusNodin(
    input: AlihStatusNodinContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusNodinContract.delete.parse(input);
        await AlihStatusNodinService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/nodin");

        return {
            success: true,
            data: undefined,
            message: "Nota dinas alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusNodin");
    }
}
