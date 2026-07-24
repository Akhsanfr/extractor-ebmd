"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { FindMatchKodePersediaanContract } from "./findMatchKodePersediaan.contract";
import { FindMatchKodePersediaanService } from "./findMatchKodePersediaan.service";

export async function actionFindMatchKodePersediaan(
    input: FindMatchKodePersediaanContract.InputDTO
): Promise<ActionResponse<FindMatchKodePersediaanContract.OutputDTO>> {
    try {
        // 1. Validation
        const validated = FindMatchKodePersediaanContract.input.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validasi gagal",
                // validated.error.flatten().fieldErrors
            );
        }

        // 2. Service Call
        const result = await FindMatchKodePersediaanService.matchItems(validated.data);

        // 3. Response
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        return handleActionError(error);
    }
}