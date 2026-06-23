"use client";
import Supercluster from "supercluster";
import Marker from "./mapMarker";
import Map, { MapRef, Source, Layer, LayerProps } from "react-map-gl/mapbox";


import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { BBox } from "geojson";
import {
  actionCountBarang,
  actionGetBarangPointByBBox,
  actionGetBarangPolygonByBBox,
  BarangSpatialPointSelect,
  BarangSpatialPolygonSelect,
} from "@/app/actions/barang/barang.action.select";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  PointFeature,
  PolygonFeature,
  PointFeatureCollection,
  PolygonFeatureCollection,
  PointFeatureProperties,
  ProjectSpatialFeatureCollection,
} from "@/type/geoJson";
import { $detailBarangId } from "@/store/detailBarang.store";
import { useStore } from "@nanostores/react";
import {
  Users,
  Building2,
  AreaChart,
  Ruler,
  ArrowLeftRight,
  Square,
  Building,
  Layers,
} from "lucide-react";
// import DetailModal from "../detailModal";
// import { actionGetProjectSpatialByBBox } from "@/app/actions/project/project.action.select";
// import AvailableGeoKecamatan from "../geo/availableGeoKecamatan";
// import AvailableProject from "../geo/availableProject";
import { Button } from "@heroui/react";
// import {
//   Modal,
//   ModalHeader,
//   ModalFooter,
//   useDisclosure,
//   ModalContent,
//   ModalBody,
// } from "@heroui/modal";
// import ListBarang from "../barang/listBarang";
// import { actionGetGeoRtrwByBBox, GeoRtrwSelect } from "@/app/actions/geoRtrw/geoRtrw.action.select";



// ============================================================================
// CONSTANTS
// ============================================================================
const STYLES = {
  STREETS: "mapbox://styles/mapbox/streets-v12",
  SATELLITE: "mapbox://styles/mapbox/satellite-streets-v12",
};

export enum LAYER_TYPE {
  CLUSTER = "Cluster",
  POINT = "Point",
  POLYGON = "Polygon",
}

export enum SPLIT {
  MIN = process.env.NEXT_PUBLIC_SPLIT_MIN
    ? Number(process.env.NEXT_PUBLIC_SPLIT_MIN)
    : 10,
  MAX = process.env.NEXT_PUBLIC_SPLIT_MAX
    ? Number(process.env.NEXT_PUBLIC_SPLIT_MAX)
    : 15,
}

// ============================================================================
// LAYER STYLES
// ============================================================================

const POLYGON_FILL_LAYER: LayerProps = {
  id: "polygon-fill-layer",
  type: "fill",
  paint: {
    "fill-color": "#6366f1",
    "fill-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      0.5,
      0.25,
    ],
    "fill-antialias": true,
  },
};

const POLYGON_OUTLINE_LAYER: LayerProps = {
  id: "polygon-outline-layer",
  type: "line",
  paint: {
    "line-color": "#4f46e5",
    "line-width": 2,
    "line-opacity": 0.8,
  },
};

const POLYGON_LABEL_INSTANSI_LAYER: LayerProps = {
  id: "polygon-label-instansi",
  type: "symbol",
  layout: {
    "text-field": ["concat", ["get", "totalInstansi"], " 🏢|"],
    "text-font": ["Arial Unicode MS Bold", "DIN Pro Bold"],
    "text-size": 13,
    "text-anchor": "center",
    "text-offset": [-0.5, 0],
    "text-allow-overlap": true,
  },
  paint: {
    "text-color": "#fb923c",
    "text-halo-color": "#ffffff",
    "text-halo-width": 0.5,
  },
};

const POLYGON_LABEL_PEGAWAI_LAYER: LayerProps = {
  id: "polygon-label-pegawai",
  type: "symbol",
  layout: {
    "text-field": ["concat", "👥 ", ["get", "totalPegawai"]],
    "text-font": ["Arial Unicode MS Bold", "DIN Pro Bold"],
    "text-size": 13,
    "text-anchor": "center",
    "text-offset": [0.5, 0],
    "text-allow-overlap": true,
  },
  paint: {
    "text-color": "#34d399",
    "text-halo-color": "#ffffff",
    "text-halo-width": 0.5,
  },
};
const POLYGON_LABEL_LUAS: LayerProps = {
  id: "polygon-label-luas",
  type: "symbol",
  layout: {
    "text-field": ["concat", "👥 ", ["get", "luas"]],
    "text-font": ["Arial Unicode MS Bold", "DIN Pro Bold"],
    "text-size": 13,
    "text-anchor": "center",
    "text-offset": [0.5, 0],
    "text-allow-overlap": true,
  },
  paint: {
    "text-color": "black",
    // "text-halo-color": "#ffffff",
    // "text-halo-width": 0.5,
  },
};

const SPATIAL_OUTLINE_LAYER: LayerProps = {
  id: "spatial-outline-layer",
  type: "line",
  paint: {
    "line-color": "#f59e0b",
    "line-width": 3,
    "line-opacity": 0.9,
    "line-dasharray": [2, 2],
  },
};

const SPATIAL_LABEL_LAYER: LayerProps = {
  id: "spatial-label-layer",
  type: "symbol",
  layout: {
    "text-field": "📍 Rencana Pengembangan Puskesmas Kejayan",
    "text-font": ["Arial Unicode MS Bold", "DIN Pro Bold"],
    "text-size": 12,
    "text-anchor": "center",
    "text-allow-overlap": false,
  },
  paint: {
    "text-color": "#f59e0b",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1,
  },
};
const RTRW_FILL_LAYER: LayerProps = {
  id: "rtrw-fill",
  type: "fill",
  paint: {
    "fill-color": ["coalesce", ["get", "fillColor"], "#94a3b8"],
    "fill-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      0.75,
      0.45,
    ],
  },
};

const RTRW_OUTLINE_LAYER: LayerProps = {
  id: "rtrw-outline",
  type: "line",
  paint: {
    "line-color": ["coalesce", ["get", "lineColor"], "#64748b"],
    "line-width": 1.5,
    "line-opacity": 0.9,
  },
};

const RTRW_LABEL_LAYER: LayerProps = {
  id: "rtrw-label",
  type: "symbol",
  minzoom: 12,
  layout: {
    "text-field": ["get", "namaObjek"],
    "text-font": ["Arial Unicode MS Bold", "DIN Pro Bold"],
    "text-size": 10,
    "text-anchor": "center",
    "text-allow-overlap": false,
    "text-max-width": 10,
  },
  paint: {
    "text-color": "#1e293b",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.5,
  },
};



// ============================================================================
// COMPONENT
// ============================================================================
export default function MapClient({
  isExplored,
  projectId,
}: {
  isExplored: boolean;
  projectId?: number;
}) {
  const [kecamatan, setKecamatan] = useState<string | null>(null);
  const [countBarang, setCountBarang] = useState(0);
  useEffect(() => {
    const getData = async () => {
      try {
        const res = await actionCountBarang(projectId ?? null, kecamatan);
        if (!res.success) throw res.error;
        setCountBarang(res.data);
      } catch (error: any) {
        console.error("Gagal mendapatkan jumlah barang", error.message);
      }
    };
    getData();
  }, [projectId, kecamatan]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // --- RENDER TRACKER ---
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(
    `%c[DEBUG] 🔵 Render MapClient #${renderCount.current}`,
    "color: #3b82f6; font-weight: bold"
  );

  // --- REFS ---
  const rtrwTooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const hoveredFeatureIdRef = useRef<string | number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const lastDataRef = useRef<
    (BarangSpatialPointSelect | BarangSpatialPolygonSelect)[]
  >([]);
  const hasInitialFitted = useRef(false);
  const isFetching = useRef(false);
  const isProgrammaticMove = useRef(false);
  const [showRtrw, setShowRtrw] = useState(false);
  const [rtrwGeoJson, setRtrwGeoJson] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const rtrwHoveredIdRef = useRef<string | number | null>(null);

  // --- STATE ---
  const [pointFeatures, setPointFeatures] = useState<PointFeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [polygonFeatures, setPolygonFeatures] =
    useState<PolygonFeatureCollection>({
      type: "FeatureCollection",
      features: [],
    });
  const [spatialFeatures, setSpatialFeatures] =
    useState<ProjectSpatialFeatureCollection>({
      type: "FeatureCollection",
      features: [],
    });
  const [currentData, setCurrentData] = useState<
    (BarangSpatialPointSelect | BarangSpatialPolygonSelect)[]
  >([]);

  const [mapStyle, setMapStyle] = useState(STYLES.STREETS);
  const [mapIsReady, setMapIsReady] = useState(false);

  const barangId = useStore($detailBarangId);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const calculateBounds = useCallback(
    (data: (BarangSpatialPointSelect | BarangSpatialPolygonSelect)[]) => {
      if (data.length === 0) return null;
      let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;
      data.forEach((d) => {
        if ("polygon" in d && d.polygon) {
          try {
            const parsedGeom = JSON.parse(d.polygon);
            parsedGeom.coordinates[0].forEach(
              ([lng, lat]: [number, number]) => {
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
              }
            );
          } catch (e) { }
        } else {
          minLng = Math.min(minLng, d.lng);
          maxLng = Math.max(maxLng, d.lng);
          minLat = Math.min(minLat, d.lat);
          maxLat = Math.max(maxLat, d.lat);
        }
      });
      return { minLng, maxLng, minLat, maxLat };
    },
    []
  );

  const fitMapToBounds = useCallback(
    (data: (BarangSpatialPointSelect | BarangSpatialPolygonSelect)[]) => {
      if (!mapRef.current) return;
      const bounds = calculateBounds(data);
      if (!bounds) return;
      isProgrammaticMove.current = true;
      const { minLng, maxLng, minLat, maxLat } = bounds;
      mapRef.current.getMap().fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 100,
          duration: 2500,
          easing: (t) => t * (2 - t),
          essential: true,
        }
      );
      setTimeout(() => {
        isProgrammaticMove.current = false;
      }, 3000);
    },
    [calculateBounds]
  );

  // ========================================================================
  // HOVER & CLICK HANDLERS (FIXED)
  // ========================================================================

  const handleMouseMove = useCallback((event: any) => {
    const map = mapRef.current?.getMap();
    const tooltip = tooltipRef.current;
    if (!map || !tooltip) return;

    const feature = event.features?.[0];

    if (feature && feature.properties?.type === "barang") {
      // ✅ FIX: Gunakan feature.id sebagai referensi utama setFeatureState
      const featureId = feature.id;
      const { totalPegawai, totalInstansi, luas, panjang, lebar, frontage } =
        feature.properties;

      if (
        featureId !== undefined &&
        featureId !== hoveredFeatureIdRef.current
      ) {
        if (hoveredFeatureIdRef.current !== null) {
          map.setFeatureState(
            { source: "polygon-source", id: hoveredFeatureIdRef.current },
            { hover: false }
          );
        }
        hoveredFeatureIdRef.current = featureId;
        map.setFeatureState(
          { source: "polygon-source", id: featureId },
          { hover: true }
        );
        map.getCanvas().style.cursor = "pointer";
      }

      // Direct DOM Tooltip Update
      tooltip.style.display = "block";
      tooltip.style.transform = `translate(${event.point.x + 16}px, ${event.point.y + 16
        }px)`;

      const pegawaiEl = tooltip.querySelector("#tt-pegawai");
      const instansiEl = tooltip.querySelector("#tt-instansi");
      const luasEl = tooltip.querySelector("#tt-luas");
      const panjangEl = tooltip.querySelector("#tt-panjang");
      const lebarEl = tooltip.querySelector("#tt-lebar");
      const frontageEl = tooltip.querySelector("#tt-frontage");
      // ✅ Selalu update, fallback ke "-" jika null/undefined
      if (pegawaiEl) pegawaiEl.textContent = totalPegawai ?? "-";
      if (instansiEl) instansiEl.textContent = totalInstansi ?? "-";
      if (luasEl) luasEl.textContent = luas != null ? luas + " m²" : "-";
      if (panjangEl)
        panjangEl.textContent = panjang != null ? panjang + " m" : "-";
      if (lebarEl) lebarEl.textContent = lebar != null ? lebar + " m" : "-";
      if (frontageEl)
        frontageEl.textContent = frontage != null ? frontage + " m" : "-";
    } else {
      handleMouseLeave();
    }
  }, []);
  const handleRtrwMouseMove = useCallback((event: any) => {
    const map = mapRef.current?.getMap();
    const tooltip = rtrwTooltipRef.current;
    if (!map) return;

    const feature = event.features?.find((f: any) => f.layer.id === "rtrw-fill");

    if (feature) {
      const featureId = feature.id;
      const p = feature.properties;

      // -- hover state --
      if (featureId !== undefined && featureId !== rtrwHoveredIdRef.current) {
        if (rtrwHoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: "rtrw-source", id: rtrwHoveredIdRef.current },
            { hover: false }
          );
        }
        rtrwHoveredIdRef.current = featureId;
        map.setFeatureState(
          { source: "rtrw-source", id: featureId },
          { hover: true }
        );
        map.getCanvas().style.cursor = "pointer";
      }

      // -- tooltip DOM update --
      if (tooltip) {
        tooltip.style.display = "block";
        tooltip.style.transform = `translate(${event.point.x - 335}px, ${event.point.y + 16}px)`;

        // header: warna dinamis dari fillColor kawasan
        const header = tooltip.querySelector<HTMLElement>("#rtrw-tt-header");
        if (header) header.style.backgroundColor = p.fillColor ?? "#64748b";

        const set = (id: string, val: string | null | undefined) => {
          const el = tooltip.querySelector(`#${id}`);
          if (el) el.textContent = val ?? "—";
        };

        set("rtrw-tt-kode", p.kodeKawasan);
        set("rtrw-tt-nama", p.namaObjek);
        set("rtrw-tt-jenis", p.jenisRencana);
        set("rtrw-tt-orde1", p.orde1);
        set("rtrw-tt-orde2", p.orde2);
        set("rtrw-tt-orde3", p.orde3);
        set("rtrw-tt-orde4", p.orde4);
        set("rtrw-tt-provinsi", p.provinsi);
        set("rtrw-tt-kabkota", p.kabupatenKota);
        set("rtrw-tt-kecamatan", p.kecamatan);
        set("rtrw-tt-luas", p.luasArea ? `${Number(p.luasArea).toFixed(4)} ha` : null);
        set("rtrw-tt-panjang", p.shapeLength ? Number(p.shapeLength).toFixed(6) : null);
        set("rtrw-tt-area", p.shapeArea ? Number(p.shapeArea).toFixed(9) : null);
        set("rtrw-tt-catatan", p.catatan);

        // boolean overlay badges — Mapbox kirim boolean sebagai string
        const overlayMap: Record<string, any> = {
          "rtrw-tt-b-penerbangan": p.kawKeselamatanPenerbangan,
          "rtrw-tt-b-pangan": p.kawPertanianPangan,
          "rtrw-tt-b-bencana": p.kawRawanBencana,
          "rtrw-tt-b-cagar": p.kawCagarBudaya,
          "rtrw-tt-b-resapan": p.kawResapanAir,
          "rtrw-tt-b-sempadan": p.kawSempadan,
          "rtrw-tt-b-hankam": p.kawPertahananKeamanan,
          "rtrw-tt-b-karst": p.kawKarst,
          "rtrw-tt-b-tambang": p.kawPertambangan,
          "rtrw-tt-b-migrasi": p.kawMigrasiSatwa,
          "rtrw-tt-b-bumi": p.ruangDalamBumi,
        };
        Object.entries(overlayMap).forEach(([id, val]) => {
          const el = tooltip.querySelector<HTMLElement>(`#${id}`);
          if (el) {
            const active = val === true || val === "true";
            el.style.display = active ? "inline-flex" : "none";
          }
        });
      }
    } else {
      // clear hover + sembunyikan tooltip
      if (rtrwHoveredIdRef.current !== null) {
        map.setFeatureState(
          { source: "rtrw-source", id: rtrwHoveredIdRef.current },
          { hover: false }
        );
        rtrwHoveredIdRef.current = null;
        map.getCanvas().style.cursor = "";
      }
      if (tooltip) tooltip.style.display = "none";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && hoveredFeatureIdRef.current !== null) {
      map.setFeatureState(
        { source: "polygon-source", id: hoveredFeatureIdRef.current },
        { hover: false }
      );
      hoveredFeatureIdRef.current = null;
      map.getCanvas().style.cursor = "";
    }
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  }, []);

  const handleMapClick = useCallback((event: any) => {
    const features = event.features;
    console.log("f", features)
    if (
      features &&
      features.length > 0 &&
      features[0].properties.type === "barang"
    ) {
      const id = features[0].properties?.barang_id;
      if (id) $detailBarangId.set(Number(id));
    }
    if (rtrwTooltipRef.current) rtrwTooltipRef.current.style.display = "none";
  }, []);

  // ========================================================================
  // MAIN MAP UPDATE LOGIC
  // ========================================================================

  const handleMapUpdate = useCallback(async () => {
    if (!mapRef.current || isFetching.current || isProgrammaticMove.current)
      return;

    const map = mapRef.current;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    if (bounds === null) return;

    const bbox: BBox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    isFetching.current = true;

    try {
      if (zoom <= SPLIT.MAX) {
        const points = await actionGetBarangPointByBBox(
          bbox,
          kecamatan,
          projectId
        );
        lastDataRef.current = points;
        setCurrentData(points);

        if (zoom < SPLIT.MIN) {
          const index = new Supercluster({ radius: 50, maxZoom: SPLIT.MIN });
          index.load(
            points.map((d) => ({
              type: "Feature",
              id: d.id,
              geometry: { type: "Point", coordinates: [d.lng, d.lat] },
              properties: { barangId: d.id },
            }))
          );

          const clusters = index.getClusters(bbox, Math.floor(zoom));
          const features: PointFeature[] = clusters.map((f: any) => ({
            type: "Feature",
            id: f.properties.cluster ? undefined : f.properties.barangId, // Assign ID
            geometry: f.geometry,
            properties: {
              barang_id: f.properties.cluster
                ? `c-${f.properties.cluster_id}`
                : f.properties.barangId,
              point_count: f.properties.point_count || 1,
              kind: f.properties.cluster
                ? LAYER_TYPE.CLUSTER
                : LAYER_TYPE.POINT,
            } as PointFeatureProperties,
          }));
          setPointFeatures({ type: "FeatureCollection", features });
          setPolygonFeatures({ type: "FeatureCollection", features: [] });
        } else {
          const features: PointFeature[] = points.map((d) => ({
            type: "Feature",
            id: d.id, // Assign ID
            geometry: { type: "Point", coordinates: [d.lng, d.lat] },
            properties: {
              barang_id: d.id,
              kind: LAYER_TYPE.POINT,
            } as PointFeatureProperties,
          }));
          setPointFeatures({ type: "FeatureCollection", features });
          setPolygonFeatures({ type: "FeatureCollection", features: [] });
        }
      } else {
        const data = await actionGetBarangPolygonByBBox(
          bbox,
          kecamatan,
          projectId
        );
        lastDataRef.current = data;
        setCurrentData(data);

        const polygonShapes: PolygonFeature[] = [];
        const pointMarkers: PointFeature[] = [];

        data.forEach((item) => {
          if (item.polygon) {
            try {
              polygonShapes.push({
                type: "Feature",
                id: item.id, // ✅ ID dari database digunakan di sini
                geometry: {
                  type: "Polygon",
                  coordinates: JSON.parse(item.polygon).coordinates,
                },
                properties: {
                  type: "barang",
                  barang_id: item.id,
                  totalPegawai: item.totalPegawai,
                  totalInstansi: item.totalInstansi,
                  luas: item.luas,
                  panjang: item.panjang,
                  lebar: item.lebar,
                  frontage: item.frontage,
                },
              });
            } catch (e) { }
          } else {
            pointMarkers.push({
              type: "Feature",
              id: item.id,
              geometry: { type: "Point", coordinates: [item.lng, item.lat] },
              properties: {
                barang_id: item.id,
                kind: LAYER_TYPE.POINT,
              } as PointFeatureProperties,
            });
          }
        });
        setPointFeatures({ type: "FeatureCollection", features: pointMarkers });
        setPolygonFeatures({
          type: "FeatureCollection",
          features: polygonShapes,
        });
      }

      if (projectId) {
        const spatialData = await actionGetProjectSpatialByBBox(
          bbox,
          projectId
        );
        const spatialShapes = spatialData
          .map((item) => {
            try {
              return {
                type: "Feature" as const,
                id: item.id,
                geometry: JSON.parse(item.polygon),
                properties: {
                  type: "spatial" as const,
                  spatial_id: item.id,
                  spatial_type: item.type,
                  properties: item.properties,
                },
              };
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
        setSpatialFeatures({
          type: "FeatureCollection",
          features: spatialShapes as any[],
        });
      } else {
        setSpatialFeatures({ type: "FeatureCollection", features: [] });
      }
    } catch (error) {
    } finally {
      isFetching.current = false;
    }
  }, [projectId, kecamatan, showRtrw]);

  // ========================================================================
  // EFFECTS & MEMO
  // ========================================================================

  const toggleStyle = useCallback(
    () =>
      setMapStyle((prev) =>
        prev === STYLES.STREETS ? STYLES.SATELLITE : STYLES.STREETS
      ),
    []
  );
  const toggleFullscreen = () => {
    !document.fullscreenElement
      ? containerRef.current?.requestFullscreen()
      : document.exitFullscreen();
  };
  const handleFitBounds = () => {
    if (currentData.length > 0) fitMapToBounds(currentData);
  };

  useEffect(() => {
    hasInitialFitted.current = false;
  }, [projectId]);

  useEffect(() => {
    if (isExplored && !hasInitialFitted.current) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.getMap().resize();
          if (lastDataRef.current.length > 0) {
            fitMapToBounds(lastDataRef.current);
            hasInitialFitted.current = true;
          }
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isExplored, fitMapToBounds]);

  useEffect(() => {
    if (mapIsReady) handleMapUpdate();
  }, [projectId, mapIsReady, handleMapUpdate]);

  const markers = useMemo(() => {
    return pointFeatures.features.map((feature) => (
      <Marker key={feature.properties?.barang_id} feature={feature} />
    ));
  }, [pointFeatures]);

  return (
    <div
      id="map-fullscreen-container"
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl border border-slate-200 shadow-lg"
    >
      <Map
        ref={mapRef}
        onLoad={() => setMapIsReady(true)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 112.80952,
          latitude: -7.71464,
          zoom: 9.5,
        }}
        onMoveEnd={handleMapUpdate}
        onClick={handleMapClick}
        onMouseMove={(e) => { handleMouseMove(e); handleRtrwMouseMove(e); }}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={["polygon-fill-layer", "rtrw-fill"]}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        trackResize={true}
      >
        {/* BARANG POLYGON SOURCE */}
        {polygonFeatures.features.length > 0 && (
          <Source
            id="polygon-source"
            type="geojson"
            data={polygonFeatures}
            generateId={false} // ✅ FIX: Jangan biarkan Mapbox membuat ID baru
          >
            <Layer {...POLYGON_FILL_LAYER} />
            <Layer {...POLYGON_OUTLINE_LAYER} />
            {/* <Layer {...POLYGON_LABEL_INSTANSI_LAYER} />
            <Layer {...POLYGON_LABEL_PEGAWAI_LAYER} /> */}
            <Layer {...POLYGON_LABEL_LUAS} />
          </Source>
        )}
        {/* RTRW */}
        {rtrwGeoJson.features.length > 0 && (
          <Source
            id="rtrw-source"
            type="geojson"
            data={rtrwGeoJson}
            generateId={false}
          >
            <Layer {...RTRW_FILL_LAYER} />
            <Layer {...RTRW_OUTLINE_LAYER} />
            <Layer {...RTRW_LABEL_LAYER} />
          </Source>
        )}

        {/* PROJECT SPATIAL SOURCE */}
        {spatialFeatures.features.length > 0 && (
          <Source
            id="spatial-source"
            type="geojson"
            data={spatialFeatures}
            generateId={false}
          >
            <Layer {...SPATIAL_OUTLINE_LAYER} />
            <Layer {...SPATIAL_LABEL_LAYER} />
          </Source>
        )}

        {/* POINT MARKERS */}
        {markers}

        {/* TOOLTIP */}
        <div
          ref={tooltipRef}
          className="absolute z-[9999] pointer-events-none hidden"
          style={{ left: 0, top: 0, willChange: "transform" }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden min-w-[240px]">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">
                  Informasi Area
                </span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <TooltipCard
                logo={<Users />}
                id="tt-pegawai"
                title="Total Pegawai"
              />
              <TooltipCard
                logo={<Building />}
                id="tt-instansi"
                title="Total Instansi"
              />
              <TooltipCard logo={<AreaChart />} id="tt-luas" title="Luas" />
              <TooltipCard
                logo={<ArrowLeftRight />}
                id="tt-frontage"
                title="Lebar Muka"
              />
              <TooltipCard logo={<Ruler />} id="tt-panjang" title="Panjang" />
              <TooltipCard logo={<Ruler />} id="tt-lebar" title="Lebar" />
            </div>
          </div>
        </div>
        <div
          ref={rtrwTooltipRef}
          className="absolute z-[9999] pointer-events-none hidden"
          style={{ left: 0, top: 0, willChange: "transform" }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden min-w-[280px] max-w-[320px]">

            <div
              id="rtrw-tt-header"
              className="px-4 py-3 transition-colors duration-200"
              style={{ backgroundColor: "#64748b" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p id="rtrw-tt-kode" className="text-[10px] font-black text-white/80 uppercase tracking-[0.15em]">—</p>
                  <p id="rtrw-tt-nama" className="text-sm font-black text-white leading-tight mt-0.5 truncate">—</p>
                </div>
                <p id="rtrw-tt-jenis" className="text-[10px] font-bold text-white/70 text-right max-w-[110px] leading-tight shrink-0">—</p>
              </div>
            </div>

            <div className="p-3 space-y-3 text-xs">

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Klasifikasi</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <RtrwRow label="Orde 1" id="rtrw-tt-orde1" />
                  <RtrwRow label="Orde 2" id="rtrw-tt-orde2" />
                  <RtrwRow label="Orde 3" id="rtrw-tt-orde3" />
                  <RtrwRow label="Orde 4" id="rtrw-tt-orde4" />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Wilayah</p>
                <div className="space-y-1">
                  <RtrwRow label="Provinsi" id="rtrw-tt-provinsi" />
                  <RtrwRow label="Kab/Kota" id="rtrw-tt-kabkota" />
                  <RtrwRow label="Kecamatan" id="rtrw-tt-kecamatan" />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ukuran</p>
                <div className="space-y-1">
                  <RtrwRow label="Luas Area" id="rtrw-tt-luas" />
                  <RtrwRow label="Shape Length" id="rtrw-tt-panjang" />
                  <RtrwRow label="Shape Area" id="rtrw-tt-area" />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kawasan Overlay</p>
                <div className="flex flex-wrap gap-1">
                  <RtrwBadge id="rtrw-tt-b-penerbangan" label="Penerbangan" />
                  <RtrwBadge id="rtrw-tt-b-pangan" label="Pangan" />
                  <RtrwBadge id="rtrw-tt-b-bencana" label="Rawan Bencana" />
                  <RtrwBadge id="rtrw-tt-b-cagar" label="Cagar Budaya" />
                  <RtrwBadge id="rtrw-tt-b-resapan" label="Resapan Air" />
                  <RtrwBadge id="rtrw-tt-b-sempadan" label="Sempadan" />
                  <RtrwBadge id="rtrw-tt-b-hankam" label="Hankam" />
                  <RtrwBadge id="rtrw-tt-b-karst" label="Karst" />
                  <RtrwBadge id="rtrw-tt-b-tambang" label="Pertambangan" />
                  <RtrwBadge id="rtrw-tt-b-migrasi" label="Migrasi Satwa" />
                  <RtrwBadge id="rtrw-tt-b-bumi" label="Ruang Bumi" />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catatan</p>
                <p id="rtrw-tt-catatan" className="text-slate-600 leading-snug">—</p>
              </div>

            </div>
          </div>
        </div>

        {/* CONTROLS */}

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <ControlBtn
            onClick={() => setShowRtrw((prev) => !prev)}
            title="Toggle Layer RTRW"
          >
            <Layers
              width={20}
              height={20}
              className={showRtrw ? "text-emerald-600" : "text-slate-400"}
            />
          </ControlBtn>
          <ControlBtn onClick={handleFitBounds} title="Fit to Data">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </ControlBtn>
          <ControlBtn onClick={toggleFullscreen} title="Toggle Fullscreen">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </ControlBtn>
          <div className="flex flex-col bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="p-3 hover:bg-slate-50 border-b border-slate-100"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="p-3 hover:bg-slate-50"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-4 z-20">
          {showRtrw && (
            <div className="absolute bottom-28 left-4 z-20 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-3 text-xs space-y-1.5">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">
                Pola Ruang RTRW
              </p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#22c55e", opacity: 0.7 }} />
                <span className="text-slate-600">Kawasan Lindung</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#f59e0b", opacity: 0.7 }} />
                <span className="text-slate-600">Kawasan Budi Daya</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#94a3b8", opacity: 0.7 }} />
                <span className="text-slate-600">Lainnya</span>
              </div>
            </div>
          )}
          <button
            onClick={toggleStyle}
            className="group flex items-center p-1 pr-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <img
                src={
                  mapStyle === STYLES.STREETS
                    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/106.8,-6.1,10/100x100?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
                    : `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/106.8,-6.1,10/100x100?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
                }
                className="w-full h-full object-cover group-hover:scale-110 duration-500"
              />
            </div>
            <div className="ml-3 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                View
              </p>
              <p className="text-sm font-bold text-slate-700">
                {mapStyle === STYLES.STREETS ? "Satellite" : "Streets"}
              </p>
            </div>
          </button>
        </div>
        {/* <div className="absolute top-4 left-4 z-20 flex gap-2 items-center">
          <AvailableProject />
          <AvailableGeoKecamatan
            projectId={projectId}
            onSelectGeoKecamatan={(nama) => setKecamatan(nama)}
          />
          <Button
            className="shrink-0"
            onPress={() => onOpen()}
          >
            Jumlah data : {countBarang}
          </Button>
        </div> */}
      </Map>
    </div>
  );
}

function ControlBtn({ onClick, children, title }: any) {
  return (
    <button
      onClick={onClick}
      className="p-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm hover:text-indigo-600 transition-all"
      title={title}
    >
      {children}
    </button>
  );
}
function TooltipCard({
  logo,
  id,
  title,
}: {
  logo: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
      <div className="w-10 h-10 flex items-center justify-center bg-emerald-500 rounded-xl text-white shadow-sm shadow-emerald-200">
        {logo}
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.1em] mb-0.5">
          {title}
        </p>
        <p id={id} className="text-lg font-black text-slate-900 leading-none">
          Tidak Diketahui
        </p>
      </div>
    </div>
  );
}