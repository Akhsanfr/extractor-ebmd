"use server";

import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { headers } from "next/headers";
import { SuratPesananContract, SuratPesananExtractResult } from "./suratPesanan.contract";
import { suratPesananService } from "./suratPesanan.service";

export async function extractSuratPesananAction(
  formData: FormData
): Promise<ActionResponse<SuratPesananExtractResult>> {
  try {
    // 1. Authorization
    // const user = await authorizeUser(await headers(), [
    //   RoleUser.ADMIN,
    //   RoleUser.STAFF,
    // ]);
    // void user; // tersedia jika nanti butuh audit/log siapa yang mengekstrak

    // 2. Validation
    const validated = SuratPesananContract.extract.input.safeParse({
      file: formData.get("file"),
    });

    if (!validated.success) {
      throw new OperationalError(
        "Validasi gagal",
        validated.error.flatten().fieldErrors
      );
    }

    // 3. Service Call
    const result = await suratPesananService.extractFromPdf(
      validated.data.file
    );

    // 4. Response
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
