import { db } from "@/drizzle/index";
import { sebaranBmd } from "@/drizzle/schema/sebaranBmd";
import { sql, eq, ilike, or, and, isNull, isNotNull } from "drizzle-orm";
import type {
    BmdTanahDTO,
    BmdTanahFilterParams,
    BmdTanahStatDTO,
    BmdTanahStatPerPicDTO,
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
        ilike(sebaranBmd.desa, q)
    );
}

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
            .select({
                nibar: sebaranBmd.nibar,
                hak: sebaranBmd.hak,
                nomor: sebaranBmd.nomor,
                desa: sebaranBmd.desa,
                pic: sebaranBmd.pic,
                updatedBy: sebaranBmd.updatedBy,
                updatedAt: sebaranBmd.updatedAt,
                hasPolygon: sql<boolean>`(${sebaranBmd.polygon} IS NOT NULL)`,
            })
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

    return {
        data: rows,
        total: countRows[0].count,
        page,
        pageSize,
    };
}

export async function findByNibar(nibar: string): Promise<BmdTanahDTO | null> {
    const rows = await db
        .select({
            nibar: sebaranBmd.nibar,
            hak: sebaranBmd.hak,
            nomor: sebaranBmd.nomor,
            desa: sebaranBmd.desa,
            pic: sebaranBmd.pic,
            updatedBy: sebaranBmd.updatedBy,
            updatedAt: sebaranBmd.updatedAt,
            hasPolygon: sql<boolean>`(${sebaranBmd.polygon} IS NOT NULL)`,
        })
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
    // ST_GeomFromGeoJSON accepts GeoJSON geometry object
    // ST_Multi wraps Polygon into MultiPolygon if needed
    await db.execute(sql`
    UPDATE sebaran_bmd
    SET
      polygon    = ST_Multi(ST_GeomFromGeoJSON(${geoJsonString}::text)),
      updated_by = ${updatedBy},
      updated_at = NOW()
    WHERE nibar = ${nibar}
  `);
}

export async function findAllForKmlExport(): Promise<KmlExportItem[]> {
    const rows = await db.execute<{
        nibar: string;
        hak: string | null;
        nomor: string | null;
        desa: string | null;
        pic: string | null;
        polygon_kml: string;
    }>(sql`
    SELECT
      nibar,
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
        hak: r.hak,
        nomor: r.nomor,
        desa: r.desa,
        pic: r.pic,
        polygonKml: r.polygon_kml,
    }));
}