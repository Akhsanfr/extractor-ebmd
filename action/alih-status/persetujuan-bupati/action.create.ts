"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { AlihStatusPersetujuanBupatiService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusPersetujuanBupati(
    input: AlihStatusPersetujuanBupatiContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusPersetujuanBupatiContract.create.parse(input);
        await AlihStatusPersetujuanBupatiService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/persetujuan-bupati");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusPersetujuanBupati");
    }
}
