// import { InsertUserProfile, SelectUserProfile } from "@/db/schema";
// import { UserProfileContract } from "./profile.contract";

// export const UserProfileMapper = {
//     /**
//      * =========================
//      * Mapper: Select User Profile
//      * DB -> DTO (Response)
//      * =========================
//      */
//     toSelectDTO(data: SelectUserProfile): UserProfileContract.SelectDTO {
//         return {
//             id: data.id,
//             userId: data.userId,
//             nama: data.nama,
//             nip: data.nip ?? null,
//             hp: data.hp ?? null,
//             perangkatDaerahId: data.perangkatDaerahId,
//         };
//     },

//     /**
//      * =========================
//      * Mapper: Create User Profile
//      * DTO -> InsertUserProfile
//      * =========================
//      */
//     toInsert(
//         dto: UserProfileContract.CreateDTO,
//         userId: string
//     ): InsertUserProfile {
//         return {
//             userId,
//             nama: dto.nama.trim(),
//             nip: dto.nip ?? null,
//             perangkatDaerahId: dto.perangkatDaerahId,
//             createdBy: userId,
//         };
//     },

//     /**
//      * =========================
//      * Mapper: Update User Profile
//      * DTO -> Partial<InsertUserProfile>
//      * =========================
//      */
//     toUpdate(
//         dto: UserProfileContract.EditDTO,
//         userId: string
//     ): Partial<InsertUserProfile> {
//         return {
//             ...(dto.nama !== undefined && { nama: dto.nama.trim() }),
//             ...(dto.nip !== undefined && { nip: dto.nip ?? null }),
//             ...(dto.perangkatDaerahId !== undefined && {
//                 perangkatDaerahId: dto.perangkatDaerahId,
//             }),
//             updatedBy: userId,
//             updatedAt: new Date(),
//         };
//     },
// };