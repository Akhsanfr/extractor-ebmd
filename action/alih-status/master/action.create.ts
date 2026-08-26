"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusMasterContract } from "./contract";
import { AlihStatusMasterService } from "./service";
import { UserService } from "@/action/user/user/user.service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusMaster(
    input: AlihStatusMasterContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusMasterContract.create.parse(input);
        await AlihStatusMasterService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/master");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusMaster");
    }
}
