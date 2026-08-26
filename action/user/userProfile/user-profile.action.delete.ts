"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { UserProfileContract } from "./user-profile.contract";
import { userProfileService } from "./user-profile.service";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "../user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "userProfile.action.delete";

export async function deleteUserProfileAction(
  input: UserProfileContract.DeleteDTO
): Promise<ActionResponse<UserProfileContract.SelectDTO>> {
  try {
    const user = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

    const validated = UserProfileContract.delete.safeParse(input);

    if (!validated.success) {
      throw new OperationalError(
        "Validation failed",
        validated.error.flatten((issue) => issue.message).fieldErrors
      );
    }

    const data = await userProfileService.deleteUserProfile(
      validated.data.id,
      user.session.id
    );

    revalidatePath("/dashboard/user-profile");

    return {
      success: true,
      data,
      message: "User berhasil dihapus.",
    };
  } catch (err) {
    return handleActionError(err, ACTION_NAME);
  }
}
