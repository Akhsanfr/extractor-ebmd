import { sebaranBmd } from "@/drizzle/schema";
import { StatusBhumi } from "@/enum/sebaranBmd";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export interface BmdTanahDTO {
    nibar: string;
    nibel: string | null;
    hak: string | null;
    nomor: string | null;
    desa: string | null;
    pic: string | null;
    updatedBy: string | null;
    updatedAt: Date | null;
    hasPolygon: boolean;
    statusPlotting: boolean | null;
    statusBhumi: StatusBhumi | null
}

export interface BmdTanahWithGeomDTO extends BmdTanahDTO {
    polygonGeoJson: string | null;
}

// ─── Statistik ───────────────────────────────────────────────────────────────

export interface BmdTanahStatDTO {
    total: number;
    /** status_plotting IS NOT NULL (sudah diproses, terlepas dari nilainya) */
    sudahDiproses: number;
    belumDiproses: number;
    /** polygon IS NOT NULL */
    sudahDigitasi: number;
    belumDigitasi: number;
    progressProsesPct: number;
    progressDigitasiPct: number;
}

export interface BmdTanahStatPerPicDTO {
    pic: string;
    total: number;
    /** status_plotting = true */
    sudahPlotting: number;
    /** status_plotting IS NULL OR false */
    belumPlotting: number;
    /** polygon IS NOT NULL */
    sudahDigitasi: number;
    belumDigitasi: number;
}

// ─── Filter ──────────────────────────────────────────────────────────────────

export type StatusPolygonFilter = "semua" | "sudah" | "belum";
export type StatusPlottingFilter = "semua" | "sudah" | "belum" | "belum_diset";

export interface BmdTanahFilterParams {
    pic?: string;
    status?: StatusPolygonFilter;
    statusPlotting?: StatusPlottingFilter;
    search?: string; // nibar | nomor | desa | nibel
    page?: number;
    pageSize?: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

// ─── Upload GeoJSON ──────────────────────────────────────────────────────────

export interface UploadPolygonInput {
    nibar: string;
    geoJsonString: string;
    updatedBy: string;
}

export interface UploadPolygonResult {
    success: boolean;
    message: string;
}

// ─── Status Plotting ─────────────────────────────────────────────────────────

export interface UpdateStatusPlottingResult {
    success: boolean;
    message: string;
}

// ─── Update BMD (unified: polygon + status) ──────────────────────────────────

export interface UpdateBmdInput {
    nibar: string;
    updatedBy: string;
    /** Jika diisi, polygon akan diperbarui */
    geoJsonString?: string;
    statusBhumi?: StatusBhumi | null;
    keterangan: string | null;
    /** Jika diisi, status_plotting akan diperbarui */
    // statusPlotting?: boolean;
}

export interface UpdateBmdResult {
    success: boolean;
    message: string;
}

// ─── Upsert Excel ────────────────────────────────────────────────────────────

export interface ExcelRowInput {
    nibar: string;
    pic: string;
    hak?: string | null;
    nomor?: string | null;
    desa?: string | null;
    nibel?: string | null;
}

export interface UpsertExcelResult {
    success: boolean;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
}

// ─── Export KML ──────────────────────────────────────────────────────────────

export interface KmlExportItem {
    nibar: string;
    nibel: string | null;
    hak: string | null;
    nomor: string | null;
    desa: string | null;
    pic: string | null;
    polygonKml: string;
}


export const SebaranBMDContract = {
    select: createSelectSchema(sebaranBmd),
    update: createInsertSchema(sebaranBmd),
}
export namespace SebaranBMDContract {
    export type SelectDTO = z.infer<typeof SebaranBMDContract.select>;
    export type UpdateDTO = z.infer<typeof SebaranBMDContract.update>;
}
export type InputFindAll = { pic?: string, hasPolygon?: boolean, statusBhumi?: StatusBhumi | "all" | "belum set" }
