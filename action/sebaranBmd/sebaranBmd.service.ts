import * as repo from "./sebarangBmd.repository";
import type {
    BmdTanahDTO,
    BmdTanahFilterParams,
    BmdTanahStatDTO,
    BmdTanahStatPerPicDTO,
    KmlExportItem,
    PaginatedResult,
    UploadPolygonInput,
    UploadPolygonResult,
} from "./sebaranBmd.contract";

// ─── Validasi GeoJSON ─────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateGeoJson(raw: string): { geometry: object } | { error: string } {
    if (Buffer.byteLength(raw, "utf8") > MAX_FILE_BYTES) {
        return { error: "Ukuran file melebihi batas 10 MB." };
    }

    let parsed: any;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { error: "File bukan JSON yang valid." };
    }

    // Bisa berupa Feature, FeatureCollection, atau langsung geometry
    let geometry = parsed;

    if (parsed.type === "FeatureCollection") {
        if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
            return { error: "FeatureCollection tidak memiliki fitur." };
        }
        geometry = parsed.features[0].geometry;
    } else if (parsed.type === "Feature") {
        geometry = parsed.geometry;
    }

    if (!geometry || typeof geometry !== "object") {
        return { error: "Tidak ditemukan geometry pada file GeoJSON." };
    }

    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
        return {
            error: `Tipe geometry '${geometry.type}' tidak didukung. Harus Polygon atau MultiPolygon.`,
        };
    }

    if (!geometry.coordinates || geometry.coordinates.length === 0) {
        return { error: "Geometry tidak memiliki koordinat." };
    }

    return { geometry };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getStatistik(): Promise<BmdTanahStatDTO> {
    return repo.getStat();
}

export async function getStatistikPerPic(): Promise<BmdTanahStatPerPicDTO[]> {
    return repo.getStatPerPic();
}

export async function getDistinctPic(): Promise<string[]> {
    return repo.getDistinctPic();
}

export async function getListBmd(
    params: BmdTanahFilterParams
): Promise<PaginatedResult<BmdTanahDTO>> {
    return repo.findAllPaginated(params);
}

export async function uploadPolygon(
    input: UploadPolygonInput
): Promise<UploadPolygonResult> {
    const { nibar, geoJsonString, updatedBy } = input;

    // Pastikan NIBAR ada
    const existing = await repo.findByNibar(nibar);
    if (!existing) {
        return { success: false, message: `NIBAR ${nibar} tidak ditemukan.` };
    }

    // Validasi GeoJSON
    const validation = validateGeoJson(geoJsonString);
    if ("error" in validation) {
        return { success: false, message: validation.error };
    }

    // Simpan ke DB — kirim string geometry JSON saja (bukan whole GeoJSON file)
    const geometryJson = JSON.stringify(validation.geometry);

    try {
        await repo.updatePolygon(nibar, geometryJson, updatedBy);
        return { success: true, message: `Berhasil memperbarui polygon untuk NIBAR ${nibar}` };
    } catch (err) {
        console.error("[uploadPolygon] DB error:", err);
        return { success: false, message: "Gagal menyimpan polygon ke database." };
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

function buildKml(items: KmlExportItem[]): string {
    const placemarks = items
        .map(
            (item) => `  <Placemark>
    <name>${escapeXml(item.nibar)}</name>
    <ExtendedData>
      <Data name="hak"><value>${escapeXml(item.hak)}</value></Data>
      <Data name="nomor"><value>${escapeXml(item.nomor)}</value></Data>
      <Data name="desa"><value>${escapeXml(item.desa)}</value></Data>
      <Data name="pic"><value>${escapeXml(item.pic)}</value></Data>
    </ExtendedData>
    ${item.polygonKml}
  </Placemark>`
        )
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>BMD Tanah</name>
${placemarks}
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