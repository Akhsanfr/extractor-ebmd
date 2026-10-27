"use server";
import { ActionResponse, handleActionError } from "@/action/actionResponse";
import { RekonContract } from "./contract";
import { RekonService } from "./service";
// TODO(auth): aktifkan kembali import di bawah bersama pemeriksaan sesi.
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth/auth";
// import { OperationalError } from "@/action/actionResponse";

export async function actionCreateRekon(
    input: RekonContract.CreateDTO,
): Promise<ActionResponse<RekonContract.SelectDTO>> {

    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = RekonContract.create.parse(input);
        const result = await RekonService.insert(validated);

        return {
            success: true,
            data: result,
        };
    } catch (err) {
        return handleActionError(err, "actionCreateRekon");
    }
}

export async function actionInitiateRekon(
    input: RekonContract.InitiateDTO,
): Promise<ActionResponse<RekonContract.SelectWithPerangkatDaerahDTO[]>> {

    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = RekonContract.initiate.parse(input);
        const result = await RekonService.initiate(validated);

        return {
            success: true,
            data: result,
            message: "Rekon berhasil diinisiasi.",
        };
    } catch (err) {
        return handleActionError(err, "actionInitiateRekon");
    }
}
