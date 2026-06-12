"use server";

import { revalidatePath } from "next/cache";
import { BmdContract } from "./bmd.contract";
import { bmdService } from "./bmd.service";
import { actionExtractDaftarBarang } from "@/action/extractorDaftarBarang"; // Pastikan path ini betul
import { db } from "@/drizzle";
import { ActionResponse, handleActionError, OperationalError } from "../actionResponse";
import { PerangkatDaerahContract } from "../perangkatDaerah/contract";

export async function syncBmdDataAction(perangkatDaerah: PerangkatDaerahContract.SelectDTO): Promise<ActionResponse<{ totalProcessed: number }>> {
  try {
    // 1. Ekstrak data dari sumber (berjalan sepenuhnya di Server)
    const extractRes = await actionExtractDaftarBarang(perangkatDaerah);

    if (!extractRes.success || !extractRes.data) {
      throw new OperationalError(extractRes.error || "Gagal mengekstrak data dari sumber");
    }

    const extractedData = extractRes.data;

    // 2. Mapping hasil ekstrak ke format Contract DTO
    const payloadUpsert: BmdContract.BulkUpsertDTO = extractedData.map((item: any) => ({
      nibar: item.nibar,
      nomorRegister: item.nomorRegister,
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      spesifikasiNamaBarang: item.spesifikasiNamaBarang,
      spesifikasiLainnya: item.spesifikasiLainnya || null,
      jumlah: String(item.jumlah),
      satuan: item.satuan || null,
      lokasi: item.lokasi,
      perangkatDaerahId: perangkatDaerah.kodeLokasi,
    }));

    // 3. Pecah per 50 item dan terus kirim ke Service
    const CHUNK_SIZE = 50;
    let totalProcessed = 0;

    for (let i = 0; i < payloadUpsert.length; i += CHUNK_SIZE) {
      const chunk = payloadUpsert.slice(i, i + CHUNK_SIZE);

      // Validasi chunk menggunakan Zod Contract
      const validated = BmdContract.bulkUpsert.safeParse(chunk);
      if (!validated.success) {
        throw new OperationalError(
          `Validasi gagal pada batch ${Math.floor(i / CHUNK_SIZE) + 1}`,
          // validated.error.flatten().fieldErrors
        );
      }

      // Langsung panggil Service untuk upsert chunk ini ke Database
      await bmdService.bulkUpsertBmd(db, validated.data);

      totalProcessed += chunk.length;
    }

    // 4. Revalidate cache
    revalidatePath("/bmd");

    return {
      success: true,
      data: { totalProcessed },
      message: `Berhasil sinkronisasi dan upsert ${totalProcessed} data BMD (Diproses per ${CHUNK_SIZE} item)`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}