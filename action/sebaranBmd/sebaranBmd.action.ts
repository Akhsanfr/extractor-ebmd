"use server";

import { revalidatePath } from "next/cache";
import * as service from "./sebaranBmd.service";
import type { BmdTanahFilterParams, UploadPolygonResult, UpsertExcelResult } from "./sebaranBmd.contract";

// ─── Statistik ───────────────────────────────────────────────────────────────

export async function getStatistikAction() {
    return service.getStatistik();
}

export async function getStatistikPerPicAction() {
    return service.getStatistikPerPic();
}

export async function getDistinctPicAction() {
    return service.getDistinctPic();
}

// ─── Data Table ──────────────────────────────────────────────────────────────

export async function getListBmdAction(params: BmdTanahFilterParams) {
    return service.getListBmd(params);
}

// ─── Upload GeoJSON ──────────────────────────────────────────────────────────

export async function uploadPolygonAction(
    nibar: string,
    geoJsonString: string
): Promise<UploadPolygonResult> {
    // TODO: ganti dengan session user aktual
    const updatedBy = "system";

    const result = await service.uploadPolygon({ nibar, geoJsonString, updatedBy });

    if (result.success) {
        revalidatePath("/bmd-tanah");
    }

    return result;
}

// ─── Upsert Excel ────────────────────────────────────────────────────────────

/**
 * Menerima array-of-objects yang sudah di-parse client-side oleh SheetJS.
 * Server Action tidak bisa menerima File/Blob, jadi parsing dilakukan
 * di modal (client) lalu hasilnya dikirim sebagai JSON.
 */
export async function upsertFromExcelAction(
    rawRows: Record<string, unknown>[]
): Promise<UpsertExcelResult> {
    // TODO: ganti dengan session user aktual
    const updatedBy = "system";

    const result = await service.upsertFromExcel(rawRows, updatedBy);

    if (result.success) {
        revalidatePath("/bmd-tanah");
    }

    return result;
}

// ─── Export KML ──────────────────────────────────────────────────────────────

export async function exportKmlAction(): Promise<{
    kmlString: string;
    filename: string;
}> {
    return service.exportKml();
}