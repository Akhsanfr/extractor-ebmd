"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBAPenelitianContract } from "./contract";
import { AlihStatusBAPenelitianService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusBAPenelitian(
    input: AlihStatusBAPenelitianContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBAPenelitianContract.edit.parse(input);

        await AlihStatusBAPenelitianService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/ba-penelitian");

        return {
            success: true,
            data: undefined,
            message: "BA penelitian alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusBAPenelitian");
    }
}
