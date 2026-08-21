"use server";
import { ActionResponse, handleActionError } from "../actionResponse";
import { EbmdUtil } from "../sync/worker/ebmd/ebmdSync.util"

export const actionTesExtractEbmd = async (): Promise<ActionResponse<any>> => {
    try {
        // const result = await EbmdUtil.extractFromEBMD("01.00.00", "tanah");
        const result = await EbmdUtil.extractPlaywright("02.00.00");
        return { data: result, success: true };
    } catch (error: any) {
        return handleActionError(error);
    }
}