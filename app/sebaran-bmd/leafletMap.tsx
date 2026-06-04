"use client";

/**
 * LeafletMap — inner map component (loaded dynamic/no-ssr oleh GeoJsonPreviewModal)
 *
 * - Satellite layer: Esri World Imagery (tidak perlu API key)
 * - GeoJSON layer: stroke biru, semi-transparan
 * - Auto-fit bounds dari geometry
 */

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { GeoJsonObject, GeoJSON as GeoJSONType } from "geojson";
import L from "leaflet";

// Fix leaflet default marker icon (webpack asset issue)
import "leaflet/dist/leaflet.css";
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse string GeoJSON → GeoJSON object.
 * Support: Feature, FeatureCollection, Polygon, MultiPolygon, atau geometry lainnya.
 */
function parseGeoJson(raw: string): GeoJSONType | null {
    try {
        const parsed = JSON.parse(raw);
        // Normalise bare geometry → Feature
        if (parsed.type && !["Feature", "FeatureCollection"].includes(parsed.type)) {
            return {
                type: "Feature",
                geometry: parsed,
                properties: {},
            } as GeoJSONType;
        }
        return parsed as GeoJSONType;
    } catch {
        return null;
    }
}

// ─── Auto-fit bounds ──────────────────────────────────────────────────────────

function FitBounds({ geoJsonData }: { geoJsonData: GeoJSONType }) {
    const map = useMap();

    useEffect(() => {
        try {
            const layer = L.geoJSON(geoJsonData);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [32, 32] });
            }
        } catch {
            // bounds tidak valid — biarkan default center
        }
    }, [map, geoJsonData]);

    return null;
}

// ─── Styling GeoJSON layer ────────────────────────────────────────────────────

const geoJsonStyle: L.PathOptions = {
    color: "#3b82f6",        // blue-500
    weight: 2.5,
    opacity: 1,
    fillColor: "#3b82f6",
    fillOpacity: 0.15,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    geoJson: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeafletMap({ geoJson }: Props) {
    const geoJsonData = parseGeoJson(geoJson);

    // Default center Indonesia (fallback sebelum fit bounds)
    const defaultCenter: L.LatLngExpression = [-2.5, 118];
    const defaultZoom = 5;

    if (!geoJsonData) {
        return (
            <div className="flex items-center justify-center h-full bg-default-100">
                <p className="text-sm text-default-400">GeoJSON tidak dapat di-render.</p>
            </div>
        );
    }

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl
            attributionControl={false}
        >
            {/* Satellite layer — Esri World Imagery */}
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                maxZoom={19}
            />

            {/* Label overlay (nama jalan/kota) di atas satelit */}
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.6}
                maxZoom={19}
            />

            {/* Polygon layer */}
            <GeoJSON
                key={geoJson} // re-render jika GeoJSON berubah
                data={geoJsonData}
                style={geoJsonStyle}
            />

            {/* Auto-fit ke bounds polygon */}
            <FitBounds geoJsonData={geoJsonData} />
        </MapContainer>
    );
}