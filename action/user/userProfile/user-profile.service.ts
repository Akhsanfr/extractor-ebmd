
import { OperationalError } from "@/action/actionResponse";
import { UserProfileContract } from "./user-profile.contract";
import { userProfileRepository } from "./user-profile.repository";
import { db } from "@/drizzle";

export const userProfileService = {
  async createUserProfile(input: UserProfileContract.CreateDTO, userId: string) {
    return userProfileRepository.insert(db, { ...input, createdBy: userId, createdAt: new Date() });
  },

  async listUserProfiles() {
    return userProfileRepository.findAll(db);
  },

  async getUserProfile(id: number) {
    const profile = await userProfileRepository.findById(db, id);

    if (!profile) {
      throw new OperationalError("User profile tidak ditemukan.");
    }

    return profile;
  },

  async updateUserProfile(input: UserProfileContract.EditDTO, userId: string) {
    const profile = await userProfileRepository.findById(db, input.id);

    if (!profile) {
      throw new OperationalError("User profile tidak ditemukan.");
    }

    const updated = await userProfileRepository.update(db, input, userId);

    if (!updated) {
      throw new OperationalError("User profile tidak ditemukan.");
    }

    return updated;
  },

  async deleteUserProfile(id: number, userId: string) {
    const profile = await userProfileRepository.findById(db, id);

    if (!profile) {
      throw new OperationalError("User profile tidak ditemukan.");
    }

    const deleted = await userProfileRepository.softDelete(db, id, userId);

    if (!deleted) {
      throw new OperationalError("User profile tidak ditemukan.");
    }

    return deleted;
  },
};
