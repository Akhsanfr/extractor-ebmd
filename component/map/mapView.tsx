import { memo, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export const MapView = memo(({ onInit }: { onInit: (map: mapboxgl.Map) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [112.7949, -7.7211],
            zoom: 10,
        });

        map.on("load", () => onInit(map));

        return () => { map.remove(); };
    }, [onInit]);

    return <div ref={containerRef} className="h-full w-full" />;
});