import { db } from "@/drizzle";
import type { PerangkatDaerahContract } from "./contract";
import {
  findAllPerangkatDaerah,
  findPerangkatDaerahByKodeLokasi,
  upsertPerangkatDaerah,
  upsertManyPerangkatDaerah,
} from "./repository";
import { OperationalError } from "../actionResponse";

export async function getAllPerangkatDaerah(): Promise<
  PerangkatDaerahContract.SelectDTO[]
> {
  return findAllPerangkatDaerah(db);
}

export async function getPerangkatDaerahByKodeLokasi(
  kodeLokasi: string
): Promise<PerangkatDaerahContract.SelectDTO> {
  const row = await findPerangkatDaerahByKodeLokasi(db, kodeLokasi);
  if (!row) {
    throw new OperationalError(
      `Perangkat daerah dengan kode lokasi "${kodeLokasi}" tidak ditemukan`
    );
  }
  return row;
}

export async function upsertPerangkatDaerahService(
  data: PerangkatDaerahContract.CreateDTO,
  actor?: string
): Promise<PerangkatDaerahContract.SelectDTO> {
  return upsertPerangkatDaerah(db, {
    ...data,
    createdBy: actor,
    updatedBy: actor,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function upsertManyPerangkatDaerahService(
  data: PerangkatDaerahContract.CreateDTO[],
  actor?: string
): Promise<void> {
  const now = new Date();
  return upsertManyPerangkatDaerah(
    db,
    data.map((d) => ({
      ...d,
      createdBy: actor,
      updatedBy: actor,
      createdAt: now,
      updatedAt: now,
    }))
  );
}