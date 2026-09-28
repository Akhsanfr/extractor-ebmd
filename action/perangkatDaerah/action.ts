"use server";
import { PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";
import { ActionResponse, handleActionError } from "../actionResponse";
import { PerangkatDaerahContract } from "./perangkatDaerah.contract";
import {
  getAllPerangkatDaerah,
  getPerangkatDaerahByKodeLokasi,
  upsertPerangkatDaerahService,
  upsertManyPerangkatDaerahService,
  getPerangkatDaerahByJabatan,
} from "./service";

export async function getPerangkatDaerahAction(): Promise<
  ActionResponse<PerangkatDaerahContract.SelectDTO[]>
> {
  try {
    const data = await getAllPerangkatDaerah();
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getPerangkatDaerahByKodeLokasiAction(
  kodeLokasi: string
): Promise<ActionResponse<PerangkatDaerahContract.SelectDTO>> {
  try {
    const data = await getPerangkatDaerahByKodeLokasi(kodeLokasi);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}
export async function actionGetListPerangkatDaerahByJabatan(
  jabatan: string
): Promise<ActionResponse<PerangkatDaerahContract.SelectDTO[]>> {
  try {
    const data = await getPerangkatDaerahByJabatan(jabatan);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}


export async function upsertPerangkatDaerahAction(
  input: unknown
): Promise<ActionResponse<PerangkatDaerahContract.SelectDTO>> {
  try {
    const parsed = PerangkatDaerahContract.create.parse(input);
    const data = await upsertPerangkatDaerahService(parsed);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function upsertManyPerangkatDaerahAction(
  input: unknown
): Promise<ActionResponse<void>> {
  try {
    const parsed = PerangkatDaerahContract.create.array().parse(input);
    await upsertManyPerangkatDaerahService(parsed);
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}