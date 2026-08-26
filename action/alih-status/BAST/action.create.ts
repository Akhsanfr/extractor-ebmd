"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTContract } from "./contract";
import { AlihStatusBASTService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusBAST(
    input: AlihStatusBASTContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBASTContract.create.parse(input);
        await AlihStatusBASTService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/bast");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusBAST");
    }
}
