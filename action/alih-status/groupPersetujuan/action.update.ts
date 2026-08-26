"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusGroupPersetujuanContract } from "./contract";
import { AlihStatusGroupPersetujuanService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusGroupPersetujuan(
    input: AlihStatusGroupPersetujuanContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusGroupPersetujuanContract.edit.parse(input);

        await AlihStatusGroupPersetujuanService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/group");

        return {
            success: true,
            data: undefined,
            message: "Group alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusGroupPersetujuan");
    }
}
