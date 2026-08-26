"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusGroupPersetujuanMasterContract } from "./contract";
import { AlihStatusGroupPersetujuanMasterService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusGroupMaster(
    input: AlihStatusGroupPersetujuanMasterContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusGroupPersetujuanMasterContract.create.parse(input);
        await AlihStatusGroupPersetujuanMasterService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/group");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusGroupMaster");
    }
}
