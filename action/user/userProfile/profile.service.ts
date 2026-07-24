// import { db } from "@/lib/db";
// import { SelectPerangkatDaerah, SelectUserProfile } from "@/db/schema";
// import { userProfileRepository } from "./profile.repository";
// import { UserProfileContract } from "./profile.contract";
// import { UserProfileMapper } from "./profile.mapper";

// export type SelectUserProfileWithRelations = SelectUserProfile & {
//     perangkatDaerah:
//     | (SelectPerangkatDaerah & {
//         induk: SelectPerangkatDaerah | null;
//     })
//     | null;
// };

// /**
//  * ==========================================
//  * USER PROFILE SERVICE
//  * ==========================================
//  *
//  * Service layer untuk business logic operations pada user profile.
//  * Bertanggung jawab untuk:
//  * - Orchestrasi antara repository
//  * - Business logic & validation (duplikasi NIP, keberadaan profile)
//  * - Transaction management
//  *
//  * Pattern: Action -> Validation -> Mapper -> Service -> Repository
//  */

// type UserProfileService = {
//     getProfileByUserId(userId: string): Promise<SelectUserProfileWithRelations | null>;
//     createProfile(
//         dto: UserProfileContract.CreateDTO,
//         userId: string
//     ): Promise<void>;
//     updateProfile(
//         dto: UserProfileContract.EditDTO,
//         userId: string
//     ): Promise<void>;
// };

// export const userProfileService: UserProfileService = {
//     /**
//      * GET PROFILE BY USER ID
//      */
//     getProfileByUserId: async (userId) => {
//         return await userProfileRepository.findByUserId(db, userId);
//     },

//     /**
//      * CREATE PROFILE
//      *
//      * Flow:
//      * 1. Cek apakah profile sudah ada
//      * 2. Cek duplikasi NIP (jika diisi)
//      * 3. Insert ke database
//      */
//     createProfile: async (dto, userId) => {
//         return await db.transaction(async (tx) => {
//             // 1. Cek profile sudah ada
//             const existing = await userProfileRepository.findByUserId(tx, userId);
//             if (existing) {
//                 throw new Error("PROFILE_ALREADY_EXISTS");
//             }

//             // 2. Cek duplikasi NIP
//             if (dto.nip) {
//                 const nipTaken = await userProfileRepository.findByNip(tx, dto.nip);
//                 if (nipTaken) {
//                     throw new Error("NIP_ALREADY_TAKEN");
//                 }
//             }

//             // 3. Map + validasi insert shape → insert
//             const insertData = UserProfileMapper.toInsert(dto, userId);
//             const validated = UserProfileContract.insert.parse(insertData);
//             await userProfileRepository.insert(tx, validated);
//         });
//     },

//     /**
//      * UPDATE PROFILE
//      *
//      * Flow:
//      * 1. Cek profile ada
//      * 2. Cek duplikasi NIP jika NIP diubah
//      * 3. Update ke database
//      */
//     updateProfile: async (dto, userId) => {
//         return await db.transaction(async (tx) => {
//             // 1. Cek profile ada
//             const existing = await userProfileRepository.findByUserId(tx, userId);
//             if (!existing) {
//                 throw new Error("PROFILE_NOT_FOUND");
//             }

//             // 2. Cek duplikasi NIP jika NIP berubah
//             if (dto.nip && dto.nip !== existing.nip) {
//                 const nipTaken = await userProfileRepository.findByNip(tx, dto.nip);
//                 if (nipTaken) {
//                     throw new Error("NIP_ALREADY_TAKEN");
//                 }
//             }

//             // 3. Map + validasi update shape → update
//             const updateData = UserProfileMapper.toUpdate(dto, userId);
//             const validated = UserProfileContract.update.parse(updateData);
//             await userProfileRepository.update(tx, userId, validated);
//         });
//     },
// };