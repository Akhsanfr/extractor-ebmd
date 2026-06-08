import { db } from "@/drizzle";
import { RkbmdBaContract } from "./rkbmd-ba-contract";
import { findAllRkbmdBa, findRkbmdBaByPerangkatDaerahId, upsertRkbmdBa } from "./rkbmd-ba-repository";

export async function getAllRkbmdBa(): Promise<RkbmdBaContract.SelectDTO[]> {
  return findAllRkbmdBa(db);
}

export async function getRkbmdBaByPerangkatDaerahId(
  perangkatDaerahId: string
): Promise<RkbmdBaContract.SelectDTO> {
  return await findRkbmdBaByPerangkatDaerahId(db, perangkatDaerahId);
}

export async function updateRkbmdBaService(
  data: RkbmdBaContract.UpdateDTO,
  actor?: string
): Promise<RkbmdBaContract.SelectDTO> {
  await upsertRkbmdBa(db, {
    pengantar: false,
    pengadaan: false,
    pemeliharaan: false,
    namaPeserta: null,
    nipPeserta: null,
    ...data,
    updatedBy: actor,
    updatedAt: new Date(),
  });
  return findRkbmdBaByPerangkatDaerahId(db, data.perangkatDaerahId)
}