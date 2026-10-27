"use server";

import { ActionResponse, handleActionError } from "@/action/actionResponse";
import { RekonContract } from "./contract";
import { RekonService } from "./service";
// TODO(auth): aktifkan kembali import di bawah bersama pemeriksaan sesi.
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth/auth";
// import { OperationalError } from "@/action/actionResponse";

export async function actionDeleteRekon(
    input: RekonContract.DeleteDTO,
): Promise<ActionResponse<undefined>> {

    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = RekonContract.delete.parse(input);
        await RekonService.remove(validated);

        return {
            success: true,
            data: undefined,
            message: "Data rekon berhasil dihapus.",
        };
    } catch (err) {
        return handleActionError(err, "actionDeleteRekon");
    }
}
