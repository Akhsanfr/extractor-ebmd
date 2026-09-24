"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPermohonanContract } from "./contract";
import { AlihStatusPermohonanService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusPermohonan(
    input: AlihStatusPermohonanContract.CreateDTO,
): Promise<ActionResponse<AlihStatusPermohonanContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPermohonanContract.create.parse(input);
        const result = await AlihStatusPermohonanService.insert(validated, session.user.id);

        return {
            success: true,
            data: result,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusPermohonan");
    }
}
