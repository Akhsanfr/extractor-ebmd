"use server";
import { ActionResponse, handleActionError } from "@/action/actionResponse";
import { RekonContract } from "./contract";
import { RekonService } from "./service";
// TODO(auth): aktifkan kembali import di bawah bersama pemeriksaan sesi.
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth/auth";
// import { OperationalError } from "@/action/actionResponse";

export async function actionGetListRekon(query: RekonContract.QueryDTO): Promise<
    ActionResponse<RekonContract.SelectWithPerangkatDaerahDTO[]>
> {
    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const validated = RekonContract.query.parse(query);
        const data = await RekonService.getList(validated);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetListRekon");
    }
}

export async function actionGetDetailRekon(id: number): Promise<
    ActionResponse<RekonContract.SelectDTO>
> {
    try {
        // TODO(auth): auth dinonaktifkan sementara untuk modul rekon.
        // const session = await auth.api.getSession({ headers: await headers() });
        // if (!session) throw new OperationalError("Maaf, Kamu harus login dahulu.");
        const data = await RekonService.get(id);
        return {
            success: true,
            data,
        };
    } catch (err) {
        return handleActionError(err, "actionGetDetailRekon");
    }
}
