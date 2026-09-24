"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionEditAlihStatusPersetujuanBupati(
    input: AlihStatusPersetujuanBupatiContract.EditDTO,
): Promise<ActionResponse<AlihStatusPersetujuanBupatiContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPersetujuanBupatiContract.edit.parse(input);

        const res = await AlihStatusPersetujuanBupatiService.update(validated, session.user.id);

        return {
            success: true,
            data: res,
            message: "Persetujuan bupati alih status berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditAlihStatusPersetujuanBupati");
    }
}
