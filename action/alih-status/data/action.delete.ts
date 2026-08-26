"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AlihStatusDataService } from "./service";
import { AlihStatusDataContract } from "./contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";

import { auth } from "@/lib/auth/auth";

export async function actionDeleteAlihStatusData(
    input: AlihStatusDataContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusDataContract.delete.parse(input);
        await AlihStatusDataService.remove(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/data");

        return {
            success: true,
            data: undefined,
            message: "Data alih status berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteAlihStatusData");
    }
}
