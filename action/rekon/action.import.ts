"use server";

import { ActionResponse, handleActionError } from "@/action/actionResponse";
import { RekonContract } from "./contract";
import { RekonService } from "./service";
// TODO(auth): aktifkan kembali import di bawah bersama pemeriksaan sesi.
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth/auth";
// import { OperationalError } from "@/action/actionResponse";

// Menerima ImportDataDTO ({ data: File, bulan }) sesuai kontrak importData.
// Action import AlihStatusData tidak ada di file yang dilampirkan, jadi bentuk input
// mengikuti contract-nya. Sesuaikan jika action aslinya menerima FormData.
export async function actionImportRekon(
    input: RekonContract.ImportDataDTO,
): Promise<ActionResponse<undefined>> {

    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = RekonContract.importData.parse(input);
        await RekonService.import(validated);

        return {
            success: true,
            data: undefined,
            message: "Import realisasi anggaran berhasil.",
        };
    } catch (err) {
        return handleActionError(err, "actionImportRekon");
    }
}
