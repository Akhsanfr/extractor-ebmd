"use server";
import { ActionResponse, handleActionError } from "@/action/actionResponse";
import { RekonContract } from "./contract";
import { RekonService } from "./service";
// TODO(auth): aktifkan kembali import di bawah bersama pemeriksaan sesi.
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth/auth";
// import { OperationalError } from "@/action/actionResponse";

// Hanya memperbarui inputBMD pada satu baris; realisasiAnggaran tidak berubah.
export async function actionEditRekon(
    input: RekonContract.EditDTO,
): Promise<ActionResponse<RekonContract.SelectDTO>> {

    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = RekonContract.edit.parse(input);

        const result = await RekonService.update(validated);

        return {
            success: true,
            data: result,
            message: "Data rekon berhasil diperbarui.",
        };
    } catch (err) {
        return handleActionError(err, "actionEditRekon");
    }
}
