"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTContract } from "./contract";
import { AlihStatusBASTService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusBAST(
    input: AlihStatusBASTContract.EditDTO,
): Promise<ActionResponse<AlihStatusBASTContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBASTContract.edit.parse(input);

        return {
            success: true,
            data: await AlihStatusBASTService.update(validated, session.user.id),
            message: "Persetujuan BAST alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPersetujuanBAST");
    }
}
