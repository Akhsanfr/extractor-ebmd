"use server";

import { revalidatePath } from "next/cache";
import * as service from "./sebaranBmd.service";
import type {
    BmdTanahFilterParams,
    UpdateStatusPlottingResult,
    UploadPolygonResult,
    UpsertExcelResult,
} from "./sebaranBmd.contract";

// ─── Statistik ───────────────────────────────────────────────────────────────

export async function getStatistikAction() { return service.getStatistik(); }
export async function getStatistikPerPicAction() { return service.getStatistikPerPic(); }
export async function getDistinctPicAction() { return service.getDistinctPic(); }

// ─── Data Table ──────────────────────────────────────────────────────────────

export async function getListBmdAction(params: BmdTanahFilterParams) {
    return service.getListBmd(params);
}

// ─── Upload GeoJSON ──────────────────────────────────────────────────────────

export async function uploadPolygonAction(
    nibar: string,
    geoJsonString: string
): Promise<UploadPolygonResult> {
    const updatedBy = "system"; // TODO: session user
    const result = await service.uploadPolygon({ nibar, geoJsonString, updatedBy });
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Status Plotting ─────────────────────────────────────────────────────────

export async function setStatusPlottingFalseAction(
    nibar: string
): Promise<UpdateStatusPlottingResult> {
    const updatedBy = "system"; // TODO: session user
    const result = await service.setStatusPlottingFalse(nibar, updatedBy);
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Upsert Excel ────────────────────────────────────────────────────────────

export async function upsertFromExcelAction(
    rawRows: Record<string, unknown>[]
): Promise<UpsertExcelResult> {
    const updatedBy = "system"; // TODO: session user
    const result = await service.upsertFromExcel(rawRows, updatedBy);
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Export KML ──────────────────────────────────────────────────────────────

export async function exportKmlAction(): Promise<{ kmlString: string; filename: string }> {
    return service.exportKml();
}