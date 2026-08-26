"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusPersetujuanBupati(
    input: AlihStatusPersetujuanBupatiContract.EditDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPersetujuanBupatiContract.edit.parse(input);

        await AlihStatusPersetujuanBupatiService.update(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/persetujuan-bupati");

        return {
            success: true,
            data: undefined,
            message: "Persetujuan bupati alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPersetujuanBupati");
    }
}
