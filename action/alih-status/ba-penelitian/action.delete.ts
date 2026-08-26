"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AlihStatusBAPenelitianService } from "./service";
import { AlihStatusBAPenelitianContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";

export async function actionDeleteAlihStatusBAPenelitian(
    input: AlihStatusBAPenelitianContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBAPenelitianContract.delete.parse(input);
        await AlihStatusBAPenelitianService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/ba-penelitian");

        return {
            success: true,
            data: undefined,
            message: "BA penelitian alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusBAPenelitian");
    }
}
