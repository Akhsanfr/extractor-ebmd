// import { eq, isNull, and } from "drizzle-orm";
// import { SelectUserProfileWithRelations } from "./profile.service";
// import { DbOrTx } from "@/action/baseDbOrTx";
// import { UserProfileContract } from "./userProfile.contract";
// import { userProfileTable } from "@/drizzle/schema";

// /**
//  * ==========================================
//  * USER PROFILE REPOSITORY
//  * ==========================================
//  *
//  * Repository layer untuk data access operations pada user profile.
//  * Bertanggung jawab untuk:
//  * - Query data dari database
//  * - Insert / Update operations
//  *
//  * TIDAK mengandung business logic atau validation.
//  */

// export const userProfileRepository = {
//     /**
//      * ==========================================
//      * FIND BY USER ID
//      * ==========================================
//      */
//     async findByUserId(
//         db: DbOrTx,
//         userId: string
//     ): Promise<SelectUserProfileWithRelations | null> {  // ← explicit return type
//         return await db.query.userProfileTable.findFirst({
//             where: (profile, { eq }) => eq(profile.userId, userId),
//             with: {
//                 perangkatDaerah: {
//                     with: {
//                         induk: true,
//                     },
//                 },
//             },
//         }) ?? null;
//     },

//     /**
//      * ==========================================
//      * FIND BY NIP
//      * ==========================================
//      */
//     findByNip: async (
//         dbOrTx: DbOrTx,
//         nip: string
//     ): Promise<UserProfileContract.SelectDTO | null> => {
//         const result = await dbOrTx.query.userProfileTable.findFirst({
//             where: and(
//                 eq(userProfileTable.nip, nip),
//                 isNull(userProfileTable.deletedAt)
//             ),
//         });

//         return result ?? null;
//     },

//     /**
//      * ==========================================
//      * INSERT PROFILE
//      * ==========================================
//      */
//     insert: async (
//         dbOrTx: DbOrTx,
//         data: UserProfileContract.InsertDTO
//     ): Promise<UserProfileContract.SelectDTO> => {
//         const [result] = await dbOrTx
//             .insert(userProfileTable)
//             .values(data)
//             .returning();

//         return result;
//     },

//     /**
//      * ==========================================
//      * UPDATE PROFILE
//      * ==========================================
//      */
//     update: async (
//         dbOrTx: DbOrTx,
//         userId: string,
//         data: UserProfileContract.UpdateDTO
//     ): Promise<UserProfileContract.SelectDTO> => {
//         const [result] = await dbOrTx
//             .update(userProfileTable)
//             .set(data)
//             .where(
//                 and(
//                     eq(userProfileTable.userId, userId),
//                     isNull(userProfileTable.deletedAt)
//                 )
//             )
//             .returning();

//         return result;
//     },
// };