"use server";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserContract } from "./user.contract";
import { UserService } from "./user.service";
import { headers } from "next/headers";
import { UserRole } from "@/enum/user";

export const actionGetUserWithDetailByUserId = async (
    userId: string
): Promise<ActionResponse<UserContract.SelectWithDetail | null>> => {
    try {
        const res = await UserService.getUserWithDetailByUserId(userId);
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error, "actionGetUserWithDetailByUserId");
    }
}
export const actionGetUserWithDetail = async (): Promise<ActionResponse<UserContract.SelectWithDetail | null>> => {
    try {
        const res = await UserService.getUserWithDetail(await headers());
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error);
    }
}
export const actionGetListUser = async (): Promise<ActionResponse<UserContract.SelectDTO[]>> => {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);
        const res = await UserService.getListUser();
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error);
    }
}
export const actionGetListUserWithDetail = async (): Promise<ActionResponse<UserContract.SelectDTO[]>> => {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);
        const res = await UserService.getListUserWithDetail();
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error, "actionGetListUserWithDetail");
    }
}
export const actionGetListUserWithRole = async (): Promise<ActionResponse<UserContract.SelectWithRole[]>> => {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);
        const res = await UserService.getListUserWithRole();
        return { success: true, data: res };
    } catch (error) {
        return handleActionError(error, "actionGetListUserWithRole");
    }
}
