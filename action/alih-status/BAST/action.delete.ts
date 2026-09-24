"use server";

import { headers } from "next/headers";
import { AlihStatusBASTService } from "./service";
import { AlihStatusBASTContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function actionDeleteAlihStatusBAST(
    input: AlihStatusBASTContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBASTContract.delete.parse(input);
        await AlihStatusBASTService.remove(validated, session.user.id);

        return {
            success: true,
            data: undefined,
            message: "BAST alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusPersetujuanBAST");
    }
}
