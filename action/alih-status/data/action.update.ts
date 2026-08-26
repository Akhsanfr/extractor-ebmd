"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusDataContract } from "./contract";
import { AlihStatusDataService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusData(
    input: AlihStatusDataContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusDataContract.edit.parse(input);

        await AlihStatusDataService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/data");

        return {
            success: true,
            data: undefined,
            message: "Data alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusData");
    }
}
