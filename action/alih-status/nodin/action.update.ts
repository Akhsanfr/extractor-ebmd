"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusNodinContract } from "./contract";
import { AlihStatusNodinService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusNodin(
    input: AlihStatusNodinContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusNodinContract.edit.parse(input);

        await AlihStatusNodinService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/nodin");

        return {
            success: true,
            data: undefined,
            message: "Nota dinas alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusNodin");
    }
}
