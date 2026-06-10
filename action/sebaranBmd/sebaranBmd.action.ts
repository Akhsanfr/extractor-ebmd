"use server";

import { revalidatePath } from "next/cache";
import * as service from "./sebaranBmd.service";
import type {
    BmdTanahFilterParams,
    UpdateBmdInput,
    UpdateBmdResult,
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
    geoJsonString: string,
    updatedBy: string
): Promise<UploadPolygonResult> {
    const result = await service.uploadPolygon({ nibar, geoJsonString, updatedBy });
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Status Plotting ─────────────────────────────────────────────────────────

export async function updateStatusPlottingAction(
    nibar: string,
    value: boolean,
    updatedBy: string
): Promise<UpdateStatusPlottingResult> {
    const result = await service.updateStatusPlotting(nibar, value, updatedBy);
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Update BMD unified (polygon + status) ───────────────────────────────────

export async function updateBmdAction(input: UpdateBmdInput): Promise<UpdateBmdResult> {
    const result = await service.updateBmd(input);
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Upsert Excel ────────────────────────────────────────────────────────────

export async function upsertFromExcelAction(
    rawRows: Record<string, unknown>[],
): Promise<UpsertExcelResult> {
    const result = await service.upsertFromExcel(rawRows);
    if (result.success) revalidatePath("/sebaran-bmd");
    return result;
}

// ─── Export KML ──────────────────────────────────────────────────────────────

export async function exportKmlAction(): Promise<{ kmlString: string; filename: string }> {
    return service.exportKml();
}

export async function getPolygonGeoJsonAction(nibar: string): Promise<string | null> {
    return service.getPolygonGeoJson(nibar);
}