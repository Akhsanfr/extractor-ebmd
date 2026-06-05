import * as repo from "./sebarangBmd.repository";
import type {
    BmdTanahDTO,
    BmdTanahFilterParams,
    BmdTanahStatDTO,
    BmdTanahStatPerPicDTO,
    ExcelRowInput,
    KmlExportItem,
    PaginatedResult,
    UpdateStatusPlottingResult,
    UploadPolygonInput,
    UploadPolygonResult,
    UpsertExcelResult,
} from "./sebaranBmd.contract";

// ─── Validasi GeoJSON ─────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateGeoJson(raw: string): { geometry: object } | { error: string } {
    if (Buffer.byteLength(raw, "utf8") > MAX_FILE_BYTES)
        return { error: "Ukuran file melebihi batas 10 MB." };

    let parsed: any;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { error: "File bukan JSON yang valid." };
    }

    let geometry = parsed;
    if (parsed.type === "FeatureCollection") {
        if (!Array.isArray(parsed.features) || parsed.features.length === 0)
            return { error: "FeatureCollection tidak memiliki fitur." };
        geometry = parsed.features[0].geometry;
    } else if (parsed.type === "Feature") {
        geometry = parsed.geometry;
    }

    if (!geometry || typeof geometry !== "object")
        return { error: "Tidak ditemukan geometry pada file GeoJSON." };

    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")
        return { error: `Tipe geometry '${geometry.type}' tidak didukung. Harus Polygon atau MultiPolygon.` };

    if (!geometry.coordinates || geometry.coordinates.length === 0)
        return { error: "Geometry tidak memiliki koordinat." };

    return { geometry };
}

// ─── Header map Excel ─────────────────────────────────────────────────────────

const HEADER_MAP: Record<string, keyof ExcelRowInput> = {
    nibar: "nibar",
    nibel: "nibel",
    pic: "pic",
    hak: "hak",
    nomor: "nomor",
    desa: "desa",
};

export function parseExcelRows(
    rawRows: Record<string, unknown>[]
): { valid: ExcelRowInput[]; errors: string[] } {
    const valid: ExcelRowInput[] = [];
    const errors: string[] = [];

    rawRows.forEach((raw, idx) => {
        const lineNo = idx + 2;

        const normalised: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
            const mapped = HEADER_MAP[k.toLowerCase().trim()];
            if (mapped) normalised[mapped] = v != null ? String(v).trim() : "";
        }

        const nibar = normalised.nibar ?? "";
        const pic = normalised.pic ?? "";

        if (!nibar) { errors.push(`Baris ${lineNo}: NIBAR kosong, dilewati.`); return; }
        if (!pic) { errors.push(`Baris ${lineNo}: PIC kosong (NIBAR=${nibar}), dilewati.`); return; }

        valid.push({
            nibar,
            pic,
            hak: normalised.hak || null,
            nomor: normalised.nomor || null,
            desa: normalised.desa || null,
            nibel: normalised.nibel || null,
        });
    });

    return { valid, errors };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getStatistik(): Promise<BmdTanahStatDTO> { return repo.getStat(); }
export async function getStatistikPerPic(): Promise<BmdTanahStatPerPicDTO[]> { return repo.getStatPerPic(); }
export async function getDistinctPic(): Promise<string[]> { return repo.getDistinctPic(); }

export async function getListBmd(
    params: BmdTanahFilterParams
): Promise<PaginatedResult<BmdTanahDTO>> {
    return repo.findAllPaginated(params);
}

export async function uploadPolygon(
    input: UploadPolygonInput
): Promise<UploadPolygonResult> {
    const { nibar, geoJsonString, updatedBy } = input;

    const existing = await repo.findByNibar(nibar);
    if (!existing) return { success: false, message: `NIBAR ${nibar} tidak ditemukan.` };

    const validation = validateGeoJson(geoJsonString);
    if ("error" in validation) return { success: false, message: validation.error };

    try {
        await repo.updatePolygon(nibar, JSON.stringify(validation.geometry), updatedBy);
        return { success: true, message: `Berhasil memperbarui polygon untuk NIBAR ${nibar}` };
    } catch (err) {
        console.error("[uploadPolygon] DB error:", err);
        return { success: false, message: "Gagal menyimpan polygon ke database." };
    }
}

// ─── Status Plotting ─────────────────────────────────────────────────────────

export async function setStatusPlottingFalse(
    nibar: string,
    updatedBy: string
): Promise<UpdateStatusPlottingResult> {
    const existing = await repo.findByNibar(nibar);
    if (!existing) return { success: false, message: `NIBAR ${nibar} tidak ditemukan.` };

    try {
        await repo.setStatusPlottingFalse(nibar, updatedBy);
        return { success: true, message: `Status plotting NIBAR ${nibar} berhasil diperbarui.` };
    } catch (err) {
        console.error("[setStatusPlottingFalse] DB error:", err);
        return { success: false, message: "Gagal memperbarui status plotting." };
    }
}

// ─── Upsert Excel ─────────────────────────────────────────────────────────────

export async function upsertFromExcel(
    rawRows: Record<string, unknown>[],
): Promise<UpsertExcelResult> {
    if (rawRows.length === 0)
        return { success: false, inserted: 0, updated: 0, skipped: 0, errors: ["File Excel tidak memiliki baris data."] };

    const { valid, errors } = parseExcelRows(rawRows);
    const skipped = rawRows.length - valid.length;

    if (valid.length === 0)
        return { success: false, inserted: 0, updated: 0, skipped, errors };

    try {
        const { inserted, updated } = await repo.upsertFromExcel(valid);
        return { success: true, inserted, updated, skipped, errors };
    } catch (err) {
        console.error("[upsertFromExcel] DB error:", err);
        return { success: false, inserted: 0, updated: 0, skipped, errors: [...errors, "Terjadi kesalahan saat menyimpan ke database."] };
    }
}

// ─── Export KML ───────────────────────────────────────────────────────────────

function escapeXml(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function randomId(length = 20) {
    const chars = "0123456789ABCDEF";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildKml(items: KmlExportItem[]): string {
    const documentId = randomId();
    const folderId = randomId();

    const placemarks = items.map((item) => {
        const placemarkId = randomId();
        const polygon = item.polygonKml
            .replace(/^<MultiGeometry>/, "")
            .replace(/<\/MultiGeometry>$/, "");

        return `
        <Placemark id="${placemarkId}">
            <name>${escapeXml(item.nibar)} (SUDAH NIBAR)</name>
            <description><![CDATA[
<div>
<span style="font-style: normal;">
<span class="font" style="font-family:Calibri, Arial">
<span class="size" style="font-size:9pt">
${escapeXml(item.nibar)}
</span>
</span>
</span><br>
</div>
            ]]></description>
            <LookAt>
                <longitude>112.89865</longitude>
                <latitude>-7.65222</latitude>
                <altitude>0</altitude>
                <heading>0</heading>
                <tilt>0</tilt>
                <gx:fovy>35</gx:fovy>
                <range>100</range>
                <altitudeMode>absolute</altitudeMode>
            </LookAt>
            <styleUrl>#__managed_style_0719EC65FA3FC6428D74</styleUrl>
            ${polygon}
        </Placemark>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:gx="http://www.google.com/kml/ext/2.2">

<Document id="${documentId}">
    <Folder id="${folderId}">

${placemarks}

    </Folder>
</Document>

</kml>`;
}

export async function exportKml(): Promise<{ kmlString: string; filename: string }> {
    const items = await repo.findAllForKmlExport();
    const kmlString = buildKml(items);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `bmd-tanah-${date}.kml`;
    return { kmlString, filename };
}