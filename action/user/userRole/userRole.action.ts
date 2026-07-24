"use server"
import { ActionResponse, handleActionError } from "@/action/actionResponse";
import { UserRoleContract } from "./userRole.contract";
import { UserRoleService } from "./userRole.service";
import { UserRole } from "@/enum/user";

export const actionGetUserRoles = async (
    userId: string
): Promise<ActionResponse<UserRoleContract.Select[]>> => {
    try {
        const data = await UserRoleService.getRolesByUserId(userId);
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
};

export const actionAttachUserRole = async (
    userId: string,
    role: UserRole
): Promise<ActionResponse<UserRoleContract.Select>> => {
    try {
        const parsed = UserRoleContract.attachRole.parse({ userId, role });
        const data = await UserRoleService.attachRole(parsed.userId, parsed.role);
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
};

export const actionAttachUserRoles = async (
    userId: string,
    roles: UserRole[]
): Promise<ActionResponse<UserRoleContract.Select[]>> => {
    try {
        const parsed = UserRoleContract.attachRoles.parse({ userId, roles });
        const data = await UserRoleService.attachRoles(parsed.userId, parsed.roles);
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
};

export const actionDetachUserRole = async (
    userId: string,
    role: UserRole
): Promise<ActionResponse<{ detached: boolean }>> => {
    try {
        const parsed = UserRoleContract.detachRole.parse({ userId, role });
        const detached = await UserRoleService.detachRole(parsed.userId, parsed.role);
        return { success: true, data: { detached } };
    } catch (error) {
        return handleActionError(error);
    }
};

export const actionDetachAllUserRoles = async (
    userId: string
): Promise<ActionResponse<{ detached: boolean }>> => {
    try {
        const detached = await UserRoleService.detachAllRoles(userId);
        return { success: true, data: { detached } };
    } catch (error) {
        return handleActionError(error);
    }
};

export const actionSyncUserRoles = async (
    userId: string,
    roles: UserRole[]
): Promise<ActionResponse<UserRoleContract.Select[]>> => {
    try {
        const parsed = UserRoleContract.attachRoles.parse({ userId, roles });
        const data = await UserRoleService.syncRoles(parsed.userId, parsed.roles);
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
};