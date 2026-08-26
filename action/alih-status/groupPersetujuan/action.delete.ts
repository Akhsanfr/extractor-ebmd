"use server";

import { headers } from "next/headers";
import { AlihStatusGroupPersetujuanService } from "./service";
import { AlihStatusGroupPersetujuanContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";

export async function actionDeleteAlihStatusGroup(
    input: AlihStatusGroupPersetujuanContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusGroupPersetujuanContract.delete.parse(input);
        await AlihStatusGroupPersetujuanService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/group");

        return {
            success: true,
            data: undefined,
            message: "Group alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusGroup");
    }
}
