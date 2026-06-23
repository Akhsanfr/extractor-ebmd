// ============================================================================
// EXAMPLE: Updated Marker Component with Typed Properties
// ============================================================================

import { memo } from "react";
import { Marker as MapGLMarker } from "react-map-gl/mapbox";
import { $detailBarangId } from "@/store/detailBarang.store";
import { PointFeature, PointFeatureProperties } from "@/type/geoJson";
import { LAYER_TYPE } from "./mapClient";

interface MarkerProps {
    feature: PointFeature; // Now fully typed!
}

const Marker = ({ feature }: MarkerProps) => {
    console.log("RENDER MARKER", feature.properties.barang_id)

    const { geometry, properties } = feature;
    const [longitude, latitude] = geometry.coordinates;

    // TypeScript now knows these properties exist and their types!
    const isCluster = properties.kind === LAYER_TYPE.CLUSTER;
    const count = properties.point_count || 0;
    const id = properties.barang_id;

    return (
        <MapGLMarker
            longitude={longitude}
            latitude={latitude}
            onClick={() => $detailBarangId.set(Number(id))}
        >
            <div className="relative flex items-center justify-center">
                {isCluster ? (
                    <>
                        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white shadow-lg">
                            {count}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0 h-full w-full rounded-full bg-sky-400 animate-[ping_3s_infinite] opacity-75"></div>
                        <div className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-md"></div>
                    </>
                )}
            </div>
        </MapGLMarker>
    );
};

export default memo(Marker, (prevProps, nextProps) => {
    // TypeScript now ensures type safety in comparison
    return (
        prevProps.feature.properties.barang_id === nextProps.feature.properties.barang_id &&
        prevProps.feature.geometry.coordinates[0] === nextProps.feature.geometry.coordinates[0] &&
        prevProps.feature.geometry.coordinates[1] === nextProps.feature.geometry.coordinates[1]
    );
});