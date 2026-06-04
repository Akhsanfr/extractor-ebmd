// ─── DTOs ────────────────────────────────────────────────────────────────────

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
    statusPlotting: boolean | null;     // ← baru
}

export interface BmdTanahWithGeomDTO extends BmdTanahDTO {
    polygonGeoJson: string | null;
}

// ─── Statistik ───────────────────────────────────────────────────────────────

export interface BmdTanahStatDTO {
    total: number;
    sudahDigitasi: number;
    belumDigitasi: number;
    progressPct: number;
}

export interface BmdTanahStatPerPicDTO {
    pic: string;
    total: number;
    sudah: number;
    belum: number;
}

// ─── Filter ──────────────────────────────────────────────────────────────────

export type StatusPolygonFilter = "semua" | "sudah" | "belum";

export interface BmdTanahFilterParams {
    pic?: string;
    status?: StatusPolygonFilter;
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

// ─── Upsert Excel ────────────────────────────────────────────────────────────

/** Satu baris dari file Excel setelah parsing & validasi */
export interface ExcelRowInput {
    nibar: string;          // wajib, tidak boleh kosong
    pic: string;            // wajib, tidak boleh kosong
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