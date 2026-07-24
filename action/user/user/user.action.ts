"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserContract } from "./user.contract";
import { UserService } from "./user.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const actionGetUserProfile = async (
    userId: string
): Promise<ActionResponse<UserContract.SelectWithProfile | null>> => {
    try {
        const res = await UserService.getUserWithProfile(userId);
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error);
    }
}

export const actionGetUserWithDetail = async (): Promise<ActionResponse<UserContract.SelectWithDetail | null>> => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new OperationalError("Pengguna belum login");
        }
        const res = await UserService.getUserWithDetail(session.user.id);
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error, "actionGetUserWithDetail");
    }
}
