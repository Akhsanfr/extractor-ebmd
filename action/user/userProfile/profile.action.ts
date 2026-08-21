// "use server";

// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";
// import { auth } from "@/lib/auth";
// import { ActionResponse, OperationalError } from "../actionResponse";
// import { userProfileService } from "./profile.service";
// import { UserProfileContract } from "./profile.contract";
// import { UserProfileMapper } from "./profile.mapper";
// import { userProfileRepository } from "./profile.repository";

// /**
//  * ==========================================
//  * CREATE PROFILE ACTION
//  * Guard: Authenticated user (any role)
//  * ==========================================
//  */
// export async function createProfileAction(
//     input: UserProfileContract.CreateDTO
// ): Promise<ActionResponse<undefined>> {
//     try {
//         // ── 1. Auth ───────────────────────────────────────────────────────
//         const session = await auth.api.getSession({
//             headers: await headers(),
//         });
//         if (!session) {
//             throw new OperationalError(
//                 "Unauthorized"
//             );
//         }

//         // ── 2. Validasi DTO ───────────────────────────────────────────────
//         const validation = UserProfileContract.create.safeParse(input);
//         if (!validation.success) {
//             throw new OperationalError(
//                 "Validation failed",
//                 validation.error.flatten((issue) => issue.message).fieldErrors
//             );
//         };
//         await userProfileService.createProfile(validation.data, session.user.id);

//         return {
//             success: true,
//             data: undefined,
//             message: "Profile berhasil dibuat",
//         };
//     } catch (error) {
//         if (error instanceof Error) {
//             if (error.message === "PROFILE_ALREADY_EXISTS") {
//                 return {
//                     success: false,
//                     error: { message: "Profile sudah ada.", code: "CONFLICT" },
//                 };
//             }
//             if (error.message === "NIP_ALREADY_TAKEN") {
//                 return {
//                     success: false,
//                     error: {
//                         message: "Validation failed",
//                         code: "VALIDATION_FAILED",
//                         validation: { nip: ["NIP sudah digunakan oleh pengguna lain"] },
//                     },
//                 };
//             }
//         }

//         return {
//             success: false,
//             error: { message: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
//         };
//     }
// }

// /**
//  * ==========================================
//  * UPDATE PROFILE ACTION
//  * Guard: Authenticated user (any role)
//  * ==========================================
//  */
// export async function updateProfileAction(
//     input: UserProfileContract.EditDTO
// ): Promise<ActionResponse<undefined>> {
//     try {
//         // ── 1. Auth ───────────────────────────────────────────────────────
//         const session = await auth.api.getSession({
//             headers: await headers(),
//         });
//         if (!session) {
//             return {
//                 success: false,
//                 error: { message: "Unauthorized.", code: "UNAUTHORIZED" },
//             };
//         }

//         // ── 2. Validasi DTO ───────────────────────────────────────────────
//         const validation = UserProfileContract.edit.safeParse(input);
//         if (!validation.success) {
//             return {
//                 success: false,
//                 error: {
//                     message: "Validation failed",
//                     code: "VALIDATION_FAILED",
//                     validation: validation.error.flatten((f) => f.message).fieldErrors,
//                 },
//             };
//         }

//         if (Object.keys(validation.data).length === 0) {
//             return {
//                 success: false,
//                 error: { message: "Tidak ada data yang diperbarui.", code: "VALIDATION_FAILED" },
//             };
//         }

//         // ── 3. Panggil service ────────────────────────────────────────────
//         await userProfileService.updateProfile(validation.data, session.user.id);


//         revalidatePath("/profile");
//         return {
//             success: true,
//             data: undefined,
//             message: "Profile berhasil diperbarui",
//         };
//     } catch (error) {
//         if (error instanceof Error) {
//             if (error.message === "PROFILE_NOT_FOUND") {
//                 return {
//                     success: false,
//                     error: { message: "Profile tidak ditemukan.", code: "NOT_FOUND" },
//                 };
//             }
//             if (error.message === "NIP_ALREADY_TAKEN") {
//                 return {
//                     success: false,
//                     error: {
//                         message: "Validation failed",
//                         code: "VALIDATION_FAILED",
//                         validation: { nip: ["NIP sudah digunakan oleh pengguna lain"] },
//                     },
//                 };
//             }
//         }

//         console.error("[updateProfileAction]", error);
//         return {
//             success: false,
//             error: { message: "Terjadi kesalahan server.", code: "SERVER_ERROR" },
//         };
//     }
// }