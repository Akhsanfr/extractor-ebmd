"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusPersetujuanBupati(
    input: AlihStatusPersetujuanBupatiContract.CreateDTO,
): Promise<ActionResponse<AlihStatusPersetujuanBupatiContract.SelectDTO>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPersetujuanBupatiContract.create.parse(input);
        const res = await AlihStatusPersetujuanBupatiService.insert(validated, session.user.id);

        return {
            success: true,
            data: res,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusPersetujuanBupati");
    }
}
