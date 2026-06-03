"use server";

import { revalidatePath } from "next/cache";
import * as service from "./sebaranBmd.service";
import type { BmdTanahFilterParams, UploadPolygonResult } from "./sebaranBmd.contract";

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

// ─── Upload ──────────────────────────────────────────────────────────────────

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

// ─── Export KML ──────────────────────────────────────────────────────────────

export async function exportKmlAction(): Promise<{
    kmlString: string;
    filename: string;
}> {
    return service.exportKml();
}