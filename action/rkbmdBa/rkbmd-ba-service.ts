import { db } from "@/drizzle";
import { RkbmdBaContract } from "./rkbmd-ba-contract";
import { findAllRkbmdBa, findRkbmdBaByPerangkatDaerahId, upsertRkbmdBa } from "./rkbmd-ba-repository";
import { OperationalError } from "../actionResponse";

export async function getAllRkbmdBa(): Promise<RkbmdBaContract.SelectDTO[]> {
  return findAllRkbmdBa(db);
}

export async function getRkbmdBaByPerangkatDaerahId(
  perangkatDaerahId: string
): Promise<RkbmdBaContract.SelectDTO> {
  const row = await findRkbmdBaByPerangkatDaerahId(db, perangkatDaerahId);
  if (!row) {
    throw new OperationalError(
      `RKBMD BA untuk perangkat daerah "${perangkatDaerahId}" tidak ditemukan`
    );
  }
  return row;
}

export async function updateRkbmdBaService(
  data: RkbmdBaContract.UpdateDTO,
  actor?: string
): Promise<RkbmdBaContract.SelectDTO> {
  return upsertRkbmdBa(db, {
    pengantar: false,
    pengadaan: false,
    pemeliharaan: false,
    namaPeserta: null,
    nipPeserta: null,
    ...data,
    updatedBy: actor,
    updatedAt: new Date(),
  });
}