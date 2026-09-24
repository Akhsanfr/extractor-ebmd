"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBAPenelitianContract } from "./contract";
import { AlihStatusBAPenelitianService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusBAPenelitian(
    input: AlihStatusBAPenelitianContract.EditDTO,
): Promise<ActionResponse<AlihStatusBAPenelitianContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBAPenelitianContract.edit.parse(input);

        const data = await AlihStatusBAPenelitianService.update(validated, session.user.id);

        return {
            success: true,
            data: data,
            message: "BA penelitian alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusBAPenelitian");
    }
}
