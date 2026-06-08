"use server";

import { ActionResponse, handleActionError } from "../actionResponse";
import { RkbmdBaContract } from "./rkbmd-ba-contract";
import { getAllRkbmdBa, getRkbmdBaByPerangkatDaerahId, updateRkbmdBaService } from "./rkbmd-ba-service";


export async function getRkbmdBaAction(): Promise<
  ActionResponse<RkbmdBaContract.SelectDTO[]>
> {
  try {
    const data = await getAllRkbmdBa();
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRkbmdBaByIdAction(
  perangkatDaerahId: string
): Promise<ActionResponse<RkbmdBaContract.SelectDTO>> {
  try {
    const data = await getRkbmdBaByPerangkatDaerahId(perangkatDaerahId);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateRkbmdBaAction(
  input: RkbmdBaContract.InsertDTO
): Promise<ActionResponse<RkbmdBaContract.SelectDTO>> {
  try {
    const parsed = RkbmdBaContract.update.parse(input);
    const data = await updateRkbmdBaService(parsed);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}