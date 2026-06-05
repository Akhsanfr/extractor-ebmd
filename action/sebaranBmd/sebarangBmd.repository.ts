import { db } from "@/drizzle/index";
import { sebaranBmd } from "@/drizzle/schema/sebaranBmd";
import { sql, eq, ilike, or, and, isNull, isNotNull } from "drizzle-orm";
import type {
    BmdTanahDTO,
    BmdTanahFilterParams,
    BmdTanahStatDTO,
    BmdTanahStatPerPicDTO,
    ExcelRowInput,
    KmlExportItem,
    PaginatedResult,
} from "./sebaranBmd.contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStatusCondition(status?: string) {
    if (status === "sudah") return isNotNull(sebaranBmd.polygon);
    if (status === "belum") return isNull(sebaranBmd.polygon);
    return undefined;
}

function buildSearchCondition(search?: string) {
    if (!search?.trim()) return undefined;
    const q = `%${search.trim()}%`;
    return or(
        ilike(sebaranBmd.nibar, q),
        ilike(sebaranBmd.nomor, q),
        ilike(sebaranBmd.desa, q),
        ilike(sebaranBmd.nibel, q),
    );
}

/** Kolom yang dipilih di semua query list/single */
const selectCols = {
    nibar: sebaranBmd.nibar,
    nibel: sebaranBmd.nibel,
    hak: sebaranBmd.hak,
    nomor: sebaranBmd.nomor,
    desa: sebaranBmd.desa,
    pic: sebaranBmd.pic,
    updatedBy: sebaranBmd.updatedBy,
    updatedAt: sebaranBmd.updatedAt,
    hasPolygon: sql<boolean>`(${sebaranBmd.polygon} IS NOT NULL)`,
    statusPlotting: sebaranBmd.statusPlotting,   // ← baru
};

// ─── Repository ──────────────────────────────────────────────────────────────

export async function findAllPaginated(
    params: BmdTanahFilterParams
): Promise<PaginatedResult<BmdTanahDTO>> {
    const { pic, status, search, page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [
        pic && pic !== "" ? eq(sebaranBmd.pic, pic) : undefined,
        buildStatusCondition(status),
        buildSearchCondition(search),
    ].filter(Boolean);

    const where = conditions.length > 0 ? and(...(conditions as any[])) : undefined;

    const [rows, countRows] = await Promise.all([
        db
            .select(selectCols)
            .from(sebaranBmd)
            .where(where)
            .orderBy(sebaranBmd.nibar)
            .limit(pageSize)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(sebaranBmd)
            .where(where),
    ]);

    return { data: rows, total: countRows[0].count, page, pageSize };
}

export async function findByNibar(nibar: string): Promise<BmdTanahDTO | null> {
    const rows = await db
        .select(selectCols)
        .from(sebaranBmd)
        .where(eq(sebaranBmd.nibar, nibar))
        .limit(1);

    return rows[0] ?? null;
}

export async function getStat(): Promise<BmdTanahStatDTO> {
    const rows = await db
        .select({
            total: sql<number>`count(*)::int`,
            sudahDigitasi: sql<number>`count(*) filter (where ${sebaranBmd.polygon} is not null)::int`,
        })
        .from(sebaranBmd);

    const { total, sudahDigitasi } = rows[0];
    const belumDigitasi = total - sudahDigitasi;
    const progressPct = total > 0 ? (sudahDigitasi / total) * 100 : 0;

    return {
        total,
        sudahDigitasi,
        belumDigitasi,
        progressPct: Math.round(progressPct * 100) / 100,
    };
}

export async function getStatPerPic(): Promise<BmdTanahStatPerPicDTO[]> {
    const rows = await db
        .select({
            pic: sebaranBmd.pic,
            total: sql<number>`count(*)::int`,
            sudah: sql<number>`count(*) filter (where ${sebaranBmd.polygon} is not null)::int`,
        })
        .from(sebaranBmd)
        .groupBy(sebaranBmd.pic)
        .orderBy(sebaranBmd.pic);

    return rows.map((r) => ({
        pic: r.pic ?? "(Tanpa PIC)",
        total: r.total,
        sudah: r.sudah,
        belum: r.total - r.sudah,
    }));
}

export async function getDistinctPic(): Promise<string[]> {
    const rows = await db
        .selectDistinct({ pic: sebaranBmd.pic })
        .from(sebaranBmd)
        .where(isNotNull(sebaranBmd.pic))
        .orderBy(sebaranBmd.pic);

    return rows.map((r) => r.pic!);
}

export async function updatePolygon(
    nibar: string,
    geoJsonString: string,
    updatedBy: string
): Promise<void> {
    await db.execute(sql`
        UPDATE sebaran_bmd
        SET
            polygon    = ST_Multi(ST_GeomFromGeoJSON(${geoJsonString}::text)),
            updated_by = ${updatedBy},
            updated_at = NOW()
        WHERE nibar = ${nibar}
    `);
}

// ─── Status Plotting ─────────────────────────────────────────────────────────

export async function updateStatusPlotting(
    nibar: string,
    status: boolean,
    updatedBy: string,
): Promise<void> {
    await db
        .update(sebaranBmd)
        .set({
            statusPlotting: status,
            updatedBy,
            updatedAt: new Date(),
        })
        .where(eq(sebaranBmd.nibar, nibar));
}

// ─── KML Export ──────────────────────────────────────────────────────────────

export async function findAllForKmlExport(): Promise<KmlExportItem[]> {
    const rows = await db.execute<{
        nibar: string;
        nibel: string | null;
        hak: string | null;
        nomor: string | null;
        desa: string | null;
        pic: string | null;
        polygon_kml: string;
    }>(sql`
        SELECT
            nibar,
            nibel,
            hak,
            nomor,
            desa,
            pic,
            ST_AsKML(polygon) AS polygon_kml
        FROM sebaran_bmd
        WHERE polygon IS NOT NULL
        ORDER BY nibar
    `);

    return rows.rows.map((r: any) => ({
        nibar: r.nibar,
        nibel: r.nibel,
        hak: r.hak,
        nomor: r.nomor,
        desa: r.desa,
        pic: r.pic,
        polygonKml: r.polygon_kml,
    }));
}

// ─── Upsert dari Excel ────────────────────────────────────────────────────────

export async function upsertFromExcel(
    rows: ExcelRowInput[],
): Promise<{ inserted: number; updated: number }> {
    if (rows.length === 0) return { inserted: 0, updated: 0 };

    const values = rows.map((r) => sql`
        (
            ${r.nibar},
            ${r.pic},
            ${r.hak ?? null},
            ${r.nomor ?? null},
            ${r.desa ?? null},
            ${r.nibel ?? null},
            NOW()
        )`);

    const result = await db.execute(sql`
        INSERT INTO sebaran_bmd
        (nibar, pic, hak, nomor, desa, nibel)
        VALUES ${sql.join(values, sql`,`)}
        ON CONFLICT (nibar) DO UPDATE SET
            pic        = EXCLUDED.pic,
            hak        = EXCLUDED.hak,
            nomor      = EXCLUDED.nomor,
            desa       = EXCLUDED.desa,
            nibel      = EXCLUDED.nibel
        RETURNING xmax
    `);

    let inserted = 0;
    let updated = 0;
    for (const row of result.rows) {
        if ((row as any).xmax === "0") inserted++;
        else updated++;
    }

    return { inserted, updated };
}

export async function getPolygonGeoJson(nibar: string): Promise<string | null> {
    const rows = await db.execute<{ geojson: string | null }>(sql`
        SELECT ST_AsGeoJSON(polygon) AS geojson
        FROM sebaran_bmd
        WHERE nibar = ${nibar}
        LIMIT 1
    `);
    return rows.rows[0]?.geojson ?? null;
}