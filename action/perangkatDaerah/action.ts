"use server";
import { ActionResponse, handleActionError } from "../actionResponse";
import { PerangkatDaerahContract } from "./contract";
import {
  getAllPerangkatDaerah,
  getPerangkatDaerahByKodeLokasi,
  upsertPerangkatDaerahService,
  upsertManyPerangkatDaerahService,
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