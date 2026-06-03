// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface BmdTanahDTO {
    nibar: string;
    hak: string | null;
    nomor: string | null;
    desa: string | null;
    pic: string | null;
    updatedBy: string | null;
    updatedAt: Date | null;
    hasPolygon: boolean;
}

export interface BmdTanahWithGeomDTO extends BmdTanahDTO {
    polygonGeoJson: string | null; // GeoJSON string dari ST_AsGeoJSON
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
    search?: string; // nibar | nomor | desa
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

// ─── Export KML ──────────────────────────────────────────────────────────────

export interface KmlExportItem {
    nibar: string;
    hak: string | null;
    nomor: string | null;
    desa: string | null;
    pic: string | null;
    polygonKml: string; // output dari ST_AsKML
}