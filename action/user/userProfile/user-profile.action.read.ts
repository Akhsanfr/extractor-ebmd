"use server";

import { headers } from "next/headers";

import { UserProfileContract } from "./user-profile.contract";
import { userProfileService } from "./user-profile.service";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "../user/user.service";
import { UserRole } from "@/enum/user";

const LIST_ACTION_NAME = "userProfile.action.read.list";
const DETAIL_ACTION_NAME = "userProfile.action.read.detail";

export async function actionGetListUserProfile(): Promise<
  ActionResponse<UserProfileContract.SelectDTO[]>
> {
  try {
    const user = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

    if (!user) {
      throw new OperationalError("Unauthorized User.");
    }

    const data = await userProfileService.listUserProfiles();

    return {
      success: true,
      data,
      message: "Data user berhasil dimuat.",
    };
  } catch (err) {
    return handleActionError(err, LIST_ACTION_NAME);
  }
}

export async function getUserProfileAction(
  id: number
): Promise<ActionResponse<UserProfileContract.SelectDTO>> {
  try {
    const user = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

    if (!user) {
      throw new OperationalError("Unauthorized User.");
    }

    const data = await userProfileService.getUserProfile(id);

    return {
      success: true,
      data,
      message: "Data user berhasil dimuat.",
    };
  } catch (err) {
    return handleActionError(err, DETAIL_ACTION_NAME);
  }
}
