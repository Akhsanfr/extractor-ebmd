"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { UserProfileContract } from "./user-profile.contract";
import { userProfileService } from "./user-profile.service";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "../user/user.service";
import { UserRole } from "@/enum/user";
const ACTION_NAME = "userProfile.action.update";

export async function updateUserProfileAction(
  input: UserProfileContract.EditDTO
): Promise<ActionResponse<UserProfileContract.SelectDTO>> {
  try {
    const user = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

    if (!user) {
      throw new OperationalError("Unauthorized User.");
    }

    const validated = UserProfileContract.edit.safeParse(input);

    if (!validated.success) {
      throw new OperationalError(
        "Validation failed",
        validated.error.flatten((issue) => issue.message).fieldErrors
      );
    }

    const data = await userProfileService.updateUserProfile(validated.data, user.session.id);

    revalidatePath("/dashboard/user-profile");
    revalidatePath(`/dashboard/user-profile/${validated.data.id}`);

    return {
      success: true,
      data,
      message: "User berhasil diperbarui.",
    };
  } catch (err) {
    return handleActionError(err, ACTION_NAME);
  }
}
