"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTContract } from "./contract";
import { AlihStatusBASTService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusBAST(
    input: AlihStatusBASTContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusBASTContract.edit.parse(input);

        await AlihStatusBASTService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/bast");

        return {
            success: true,
            data: undefined,
            message: "Persetujuan BAST alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPersetujuanBAST");
    }
}
