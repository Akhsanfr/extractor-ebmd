"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTContract } from "./contract";
import { AlihStatusBASTService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusBAST(
    input: AlihStatusBASTContract.CreateDTO,
): Promise<ActionResponse<AlihStatusBASTContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBASTContract.create.parse(input);


        return {
            success: true,
            data: await AlihStatusBASTService.insert(validated, session.user.id),
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusBAST");
    }
}
