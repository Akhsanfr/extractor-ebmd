"use server";
import { UserRole } from "@/enum/user";
import { ActionResponse, handleActionError } from "../actionResponse"
import { UserService } from "../user/user/user.service"
import { headers } from "next/headers"

export const actionTesAuthoriseUser = async (): Promise<ActionResponse<{ message: string }>> => {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN])
        return {
            success: true,
            data: { message: "Authorisation success" }
        }
    } catch (e: any) {
        return handleActionError(e, "actionTesAuthoriseUser")
    }
}