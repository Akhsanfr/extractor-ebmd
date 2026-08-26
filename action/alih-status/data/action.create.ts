"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { AlihStatusDataContract } from "./contract";
import { AlihStatusDataService } from "./service";
import { auth } from "@/lib/auth/auth";

export async function actionCreateAlihStatusData(
    input: AlihStatusDataContract.CreateDTO,
): Promise<ActionResponse<undefined>> {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = AlihStatusDataContract.create.parse(input);
        await AlihStatusDataService.insert(validated, session.user.id);

        revalidatePath("/dashboard/alih-status/data");

        return {
            success: true,
            data: undefined,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateAlihStatusData");
    }
}

export async function actionImportAlihStatusData(
    input: AlihStatusDataContract.ImportDataDTO,
): Promise<ActionResponse<undefined>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        AlihStatusDataContract.importData.parse(input);
        await AlihStatusDataService.import(input, session.user.id);
        revalidatePath("/dashboard/alih-status/data");
        return {
            success: true,
            data: undefined,
            message: "Import selesai",
        };
    } catch (err) {
        return handleActionError(
            err,
            "actionImportApbdRealisasi",
        );
    }
}
