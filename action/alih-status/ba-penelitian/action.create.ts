"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBAPenelitianContract } from "./contract";
import { AlihStatusBAPenelitianService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusBAPenelitian(
    input: AlihStatusBAPenelitianContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBAPenelitianContract.create.parse(input);
        await AlihStatusBAPenelitianService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/ba-penelitian");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusBAPenelitian");
    }
}
