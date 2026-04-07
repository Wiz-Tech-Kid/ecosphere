import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, MapPin, Route } from "lucide-react";
import {
  loadMapbox,
  type MapboxGeoJsonFeatureCollection,
  type MapboxMap,
  type MapboxMouseEvent,
  type MapboxPopup,
} from "@/lib/mapbox-loader";
import type {
  CorridorSimulation,
  DeploymentSimulation,
  SimulationNode,
} from "@/services/deploymentSimulation";

const BOUNDARY_SOURCE_ID = "powamov-operational-boundary";
const CORRIDOR_SOURCE_ID = "powamov-corridors";
const NODE_SOURCE_ID = "powamov-nodes";
const SELECTED_NODE_SOURCE_ID = "powamov-selected-node";

const MAP_FALLBACK_CLASS =
  "flex h-[560px] items-center justify-center rounded-2xl border border-border bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.9))] p-8 text-center";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function buildBoundaryGeoJson(
  simulation: DeploymentSimulation,
): MapboxGeoJsonFeatureCollection {
  const polygon = [
    ...simulation.boundaryAnchors.map((anchor) => anchor.coordinates),
    simulation.boundaryAnchors[0]?.coordinates ?? simulation.center,
  ];

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [polygon],
        },
        properties: {
          name: simulation.phaseLabel,
        },
      },
    ],
  };
}

function buildCorridorGeoJson(
  corridors: CorridorSimulation[],
): MapboxGeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: corridors.map((corridor) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: corridor.path,
      },
      properties: {
        id: corridor.id,
        name: corridor.name,
        color: corridor.color,
        nodeCount: corridor.nodeCount,
        distanceKm: corridor.distanceKm,
      },
    })),
  };
}

function buildNodeGeoJson(nodes: SimulationNode[]): MapboxGeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: nodes.map((node) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: node.coordinates,
      },
      properties: {
        id: node.id,
        corridorName: node.corridorName,
        healthStatus: node.healthStatus,
        healthLabel: node.healthLabel,
        energyOutputKwh: node.energyOutputKwh,
        trafficCount: node.trafficCount,
        compressionEvents: node.compressionEvents,
        co2OffsetKg: node.co2OffsetKg,
        stripCount: node.stripCount,
        widthMeters: node.widthMeters,
        trafficDensity: node.trafficDensity,
      },
    })),
  };
}

function buildSelectedNodeGeoJson(
  selectedNode: SimulationNode | null,
): MapboxGeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: selectedNode
      ? [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: selectedNode.coordinates,
            },
            properties: {
              id: selectedNode.id,
            },
          },
        ]
      : [],
  };
}

function updateSource(
  map: MapboxMap,
  sourceId: string,
  data: MapboxGeoJsonFeatureCollection,
) {
  const source = map.getSource(sourceId);

  if (source) {
    source.setData(data);
  }
}

function renderPopupHtml(node: SimulationNode) {
  return `
    <div class="powamov-popup">
      <div class="powamov-popup__eyebrow">Deployment Node</div>
      <div class="powamov-popup__title">${node.id}</div>
      <div class="powamov-popup__sub">${node.corridorName}</div>
      <div class="powamov-popup__grid">
        <div><span>Strips</span><strong>${node.stripCount}</strong></div>
        <div><span>Width</span><strong>${node.widthMeters} m</strong></div>
        <div><span>Node Output</span><strong>${node.energyOutputKwh.toFixed(3)} kWh</strong></div>
        <div><span>Traffic</span><strong>${wholeNumberFormatter.format(node.trafficCount)}</strong></div>
        <div><span>Health</span><strong>${node.healthLabel}</strong></div>
        <div><span>CO2 Offset</span><strong>${node.co2OffsetKg.toFixed(3)} kg</strong></div>
      </div>
    </div>
  `;
}

function addLayers(map: MapboxMap) {
  if (!map.getLayer("powamov-boundary-fill")) {
    map.addLayer({
      id: "powamov-boundary-fill",
      type: "fill",
      source: BOUNDARY_SOURCE_ID,
      paint: {
        "fill-color": "#0f766e",
        "fill-opacity": 0.08,
      },
    });
  }

  if (!map.getLayer("powamov-boundary-line")) {
    map.addLayer({
      id: "powamov-boundary-line",
      type: "line",
      source: BOUNDARY_SOURCE_ID,
      paint: {
        "line-color": "#7dd3fc",
        "line-width": 1.5,
        "line-opacity": 0.6,
        "line-dasharray": [2, 2],
      },
    });
  }

  if (!map.getLayer("powamov-corridor-line")) {
    map.addLayer({
      id: "powamov-corridor-line",
      type: "line",
      source: CORRIDOR_SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#38bdf8"],
        "line-width": 4,
        "line-opacity": 0.72,
      },
    });
  }

  if (!map.getLayer("powamov-node-glow")) {
    map.addLayer({
      id: "powamov-node-glow",
      type: "circle",
      source: NODE_SOURCE_ID,
      paint: {
        "circle-radius": 9,
        "circle-color": [
          "match",
          ["get", "healthStatus"],
          "healthy",
          "#22c55e",
          "warning",
          "#fbbf24",
          "maintenance",
          "#ef4444",
          "#94a3b8",
        ],
        "circle-opacity": 0.18,
      },
    });
  }

  if (!map.getLayer("powamov-node-circle")) {
    map.addLayer({
      id: "powamov-node-circle",
      type: "circle",
      source: NODE_SOURCE_ID,
      paint: {
        "circle-radius": 4.6,
        "circle-color": [
          "match",
          ["get", "healthStatus"],
          "healthy",
          "#22c55e",
          "warning",
          "#fbbf24",
          "maintenance",
          "#ef4444",
          "#94a3b8",
        ],
        "circle-stroke-color": "#dbeafe",
        "circle-stroke-width": 1,
        "circle-opacity": 0.96,
      },
    });
  }

  if (!map.getLayer("powamov-selected-node")) {
    map.addLayer({
      id: "powamov-selected-node",
      type: "circle",
      source: SELECTED_NODE_SOURCE_ID,
      paint: {
        "circle-radius": 11,
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": "#e0f2fe",
        "circle-stroke-width": 2,
        "circle-opacity": 0.95,
      },
    });
  }
}

interface DeploymentMapProps {
  simulation: DeploymentSimulation;
  selectedNode: SimulationNode | null;
  onSelectNode: (nodeId: string) => void;
  mapboxToken?: string;
  styleUrl: string;
}

export function DeploymentMap({
  simulation,
  selectedNode,
  onSelectNode,
  mapboxToken,
  styleUrl,
}: DeploymentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<MapboxPopup | null>(null);
  const popupTimeoutRef = useRef<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const boundaryGeoJson = useMemo(() => buildBoundaryGeoJson(simulation), [simulation]);
  const corridorGeoJson = useMemo(
    () => buildCorridorGeoJson(simulation.corridors),
    [simulation.corridors],
  );
  const nodeGeoJson = useMemo(() => buildNodeGeoJson(simulation.nodes), [simulation.nodes]);
  const selectedNodeGeoJson = useMemo(
    () => buildSelectedNodeGeoJson(selectedNode),
    [selectedNode],
  );

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current) {
      return undefined;
    }

    let active = true;
    let clickHandler: ((event: MapboxMouseEvent) => void) | null = null;
    let enterHandler: ((event: MapboxMouseEvent) => void) | null = null;
    let leaveHandler: ((event: MapboxMouseEvent) => void) | null = null;

    setMapError(null);
    setMapReady(false);

    loadMapbox()
      .then((mapbox) => {
        if (!active || !mapContainerRef.current) {
          return;
        }

        mapbox.accessToken = mapboxToken;

        const map = new mapbox.Map({
          container: mapContainerRef.current,
          style: styleUrl,
          center: simulation.center,
          zoom: 9.55,
          minZoom: 8.8,
          maxZoom: 13.2,
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
          maxBounds: simulation.bounds,
        });

        mapRef.current = map;

        map.on("load", () => {
          if (!active) {
            return;
          }

          map.addSource(BOUNDARY_SOURCE_ID, {
            type: "geojson",
            data: boundaryGeoJson,
          });
          map.addSource(CORRIDOR_SOURCE_ID, {
            type: "geojson",
            data: corridorGeoJson,
          });
          map.addSource(NODE_SOURCE_ID, {
            type: "geojson",
            data: nodeGeoJson,
          });
          map.addSource(SELECTED_NODE_SOURCE_ID, {
            type: "geojson",
            data: selectedNodeGeoJson,
          });

          addLayers(map);
          map.fitBounds(simulation.bounds, {
            padding: 34,
            duration: 0,
          });

          clickHandler = (event) => {
            const feature = event.features?.[0];
            const selectedId = feature?.properties?.id;

            if (typeof selectedId === "string") {
              onSelectNode(selectedId);
            }
          };

          enterHandler = () => {
            map.getCanvas().style.cursor = "pointer";
          };

          leaveHandler = () => {
            map.getCanvas().style.cursor = "";
          };

          map.on("click", "powamov-node-circle", clickHandler);
          map.on("mouseenter", "powamov-node-circle", enterHandler);
          map.on("mouseleave", "powamov-node-circle", leaveHandler);
          setMapReady(true);
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to initialize the Mapbox deployment view.";
        setMapError(message);
      });

    return () => {
      active = false;

      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }

      popupRef.current?.remove();
      popupRef.current = null;

      const map = mapRef.current;
      if (map && clickHandler && enterHandler && leaveHandler) {
        map.off("click", "powamov-node-circle", clickHandler);
        map.off("mouseenter", "powamov-node-circle", enterHandler);
        map.off("mouseleave", "powamov-node-circle", leaveHandler);
      }

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [
    mapboxToken,
    onSelectNode,
    simulation.bounds,
    simulation.center,
    styleUrl,
  ]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    updateSource(mapRef.current, BOUNDARY_SOURCE_ID, boundaryGeoJson);
    updateSource(mapRef.current, CORRIDOR_SOURCE_ID, corridorGeoJson);
    updateSource(mapRef.current, NODE_SOURCE_ID, nodeGeoJson);
  }, [boundaryGeoJson, corridorGeoJson, mapReady, nodeGeoJson]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    updateSource(mapRef.current, SELECTED_NODE_SOURCE_ID, selectedNodeGeoJson);
  }, [mapReady, selectedNodeGeoJson]);

  useEffect(() => {
    if (!selectedNode) {
      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    if (!mapboxToken || !mapReady || !mapRef.current || !selectedNode) {
      return;
    }

    loadMapbox()
      .then((mapbox) => {
        if (!mapRef.current || !selectedNode) {
          return;
        }

        popupRef.current?.remove();

        const popup = new mapbox.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 16,
        });

        popup
          .setLngLat(selectedNode.coordinates)
          .setHTML(renderPopupHtml(selectedNode))
          .addTo(mapRef.current);

        popupRef.current = popup;

        if (popupTimeoutRef.current) {
          window.clearTimeout(popupTimeoutRef.current);
        }

        popupTimeoutRef.current = window.setTimeout(() => {
          popupRef.current?.remove();
          popupRef.current = null;
        }, 9_000);
      })
      .catch(() => {
        return;
      });
  }, [mapReady, mapboxToken, selectedNode]);

  if (!mapboxToken) {
    return (
      <div className={MAP_FALLBACK_CLASS}>
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Mapbox token required</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Add <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">VITE_MAPBOX_TOKEN</code> to
              the POWAMOV env file to render the Gaborone deployment map and snap corridors to real road geometry.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
            <Route className="h-3.5 w-3.5" />
            <span>Simulation metrics are still available below using corridor fallback paths.</span>
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={MAP_FALLBACK_CLASS}>
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Mapbox failed to initialize</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mapError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div ref={mapContainerRef} className="h-[560px] w-full" />

      <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
        <div className="rounded-full border border-sky-400/30 bg-slate-950/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.24em] text-sky-100 backdrop-blur">
          {simulation.phaseLabel}
        </div>
        <div className="rounded-full border border-border/80 bg-slate-950/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-200 backdrop-blur">
          {simulation.usedDirections ? "Road Geometry Synced" : "Fallback Corridor Geometry"}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
        {[
          ["Healthy", "#22c55e"],
          ["Warning", "#fbbf24"],
          ["Maintenance", "#ef4444"],
        ].map(([label, color]) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-slate-950/78 px-3 py-1.5 text-xs text-slate-100 backdrop-blur"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-border/70 bg-slate-950/74 px-4 py-3 text-right backdrop-blur">
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
          Phase 1 Nodes
        </div>
        <div className="mt-1 text-2xl font-semibold text-slate-50">
          {compactFormatter.format(simulation.totals.nodeCount)}
        </div>
        <div className="text-xs text-slate-300">
          {wholeNumberFormatter.format(simulation.totals.healthyCount)} healthy /{" "}
          {wholeNumberFormatter.format(simulation.totals.warningCount)} warning /{" "}
          {wholeNumberFormatter.format(simulation.totals.maintenanceCount)} maintenance
        </div>
      </div>
    </div>
  );
}
