"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusNodinContract } from "./contract";
import { AlihStatusNodinService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusNodin(
    input: AlihStatusNodinContract.CreateDTO,
): Promise<ActionResponse<AlihStatusNodinContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusNodinContract.create.parse(input);
        const res = await AlihStatusNodinService.insert(validated, session.user.id);

        return {
            success: true,
            data: res,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusNodin");
    }
}
