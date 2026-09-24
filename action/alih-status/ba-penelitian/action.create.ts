"use server";
import { headers } from "next/headers";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBAPenelitianContract } from "./contract";
import { AlihStatusBAPenelitianService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusBAPenelitian(
    input: AlihStatusBAPenelitianContract.CreateDTO,
): Promise<ActionResponse<AlihStatusBAPenelitianContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBAPenelitianContract.create.parse(input);
        const res = await AlihStatusBAPenelitianService.insert(validated, session.user.id);

        return {
            success: true,
            data: res,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusBAPenelitian");
    }
}
