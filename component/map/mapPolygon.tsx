// ============================================================================
// EXAMPLE: Updated MapPolygon Component with Typed Properties
// ============================================================================

"use client"
import { memo, useState } from "react"
import { Source, Layer, LayerProps } from 'react-map-gl/mapbox'
import { PolygonFeature, PolygonFeatureProperties } from "@/type/geoJson";

// Palette warna Tailwind (Indigo-500 & 600)
const COLORS = {
    fill: '#6366f1',    // indigo-500
    outline: '#4f46e5', // indigo-600
}

interface MapPolygonProps {
    feature: PolygonFeature; // Now fully typed!
}

const MapPolygon = ({ feature }: MapPolygonProps) => {
    // State untuk menangani hover secara deklaratif
    const [isHovered, setIsHovered] = useState(false);

    // TypeScript now knows these properties exist and their types!
    const { barang_id, totalPegawai, totalInstansi } = feature.properties;
    const sourceId = `source-${barang_id}`;

    // Styling Layer Isi (Fill)
    const fillLayer: LayerProps = {
        id: `layer-${barang_id}`,
        type: 'fill',
        paint: {
            'fill-color': COLORS.fill,
            'fill-opacity': isHovered ? 0.5 : 0.25,
            'fill-antialias': true
        }
    };

    // Styling Layer Outline
    const outlineLayer: LayerProps = {
        id: `outline-${barang_id}`,
        type: 'line',
        paint: {
            'line-color': COLORS.outline,
            'line-width': 2,
            'line-opacity': 0.8
        }
    };

    return (
        <>
            <Source
                id={sourceId}
                type="geojson"
                data={feature}

            >
                <Layer
                    id="polygon-layer-main"
                    {...fillLayer}
                // onMouseEnter={() => setIsHovered(true)}
                // onMouseLeave={() => setIsHovered(false)}
                />
                <Layer {...outlineLayer} />
            </Source>

            {/* Optional: Show data on hover */}
            {isHovered && (
                <div className="absolute z-50 bg-white p-2 rounded shadow-lg pointer-events-none">
                    <div className="text-xs">
                        <div>ID: {barang_id}</div>
                        <div>Pegawai: {totalPegawai}</div>
                        <div>Instansi: {totalInstansi}</div>
                    </div>
                </div>
            )}
        </>
    );
};

// Optimasi Memoization with type safety
export default memo(MapPolygon, (prev, next) => {
    return (
        prev.feature.properties.barang_id === next.feature.properties.barang_id &&
        prev.feature.properties.totalPegawai === next.feature.properties.totalPegawai &&
        prev.feature.properties.totalInstansi === next.feature.properties.totalInstansi &&
        JSON.stringify(prev.feature.geometry) === JSON.stringify(next.feature.geometry)
    );
});