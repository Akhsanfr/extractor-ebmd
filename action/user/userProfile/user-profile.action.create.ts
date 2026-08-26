"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";


import { UserProfileContract } from "./user-profile.contract";
import { userProfileService } from "./user-profile.service";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "../user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "userProfile.action.create";

export async function createUserProfileAction(
  input: UserProfileContract.CreateDTO
): Promise<ActionResponse<UserProfileContract.SelectDTO>> {
  try {
    const user = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

    const validated = UserProfileContract.create.safeParse(input);

    if (!validated.success) {
      console.log(validated)
      throw new OperationalError(
        "Validation failed",
        validated.error.flatten((issue) => issue.message).fieldErrors
      );
    }

    const data = await userProfileService.createUserProfile(
      validated.data,
      user.user.id
    );

    revalidatePath("/dashboard/user-profile");

    return {
      success: true,
      data,
      message: "User berhasil ditambahkan.",
    };
  } catch (err) {
    return handleActionError(err, ACTION_NAME);
  }
}
