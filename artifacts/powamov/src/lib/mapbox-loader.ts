const MAPBOX_GL_VERSION = "3.5.1";
const MAPBOX_SCRIPT_ID = "powamov-mapbox-gl-script";
const MAPBOX_STYLESHEET_ID = "powamov-mapbox-gl-stylesheet";
const MAPBOX_SCRIPT_URL = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.js`;
const MAPBOX_STYLESHEET_URL = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css`;

export type LngLatTuple = [number, number];

export interface MapboxGeoJsonPointGeometry {
  type: "Point";
  coordinates: LngLatTuple;
}

export interface MapboxGeoJsonLineGeometry {
  type: "LineString";
  coordinates: LngLatTuple[];
}

export interface MapboxGeoJsonPolygonGeometry {
  type: "Polygon";
  coordinates: LngLatTuple[][];
}

export type MapboxGeoJsonGeometry =
  | MapboxGeoJsonPointGeometry
  | MapboxGeoJsonLineGeometry
  | MapboxGeoJsonPolygonGeometry;

export type MapboxGeoJsonProperties = Record<string, string | number | boolean | null>;

export interface MapboxGeoJsonFeature<
  TGeometry extends MapboxGeoJsonGeometry = MapboxGeoJsonGeometry,
> {
  type: "Feature";
  geometry: TGeometry;
  properties: MapboxGeoJsonProperties;
}

export interface MapboxGeoJsonFeatureCollection<
  TGeometry extends MapboxGeoJsonGeometry = MapboxGeoJsonGeometry,
> {
  type: "FeatureCollection";
  features: Array<MapboxGeoJsonFeature<TGeometry>>;
}

export interface MapboxGeoJsonSource {
  setData(data: MapboxGeoJsonFeatureCollection): void;
}

export interface MapboxFeature {
  properties?: MapboxGeoJsonProperties;
  geometry?: MapboxGeoJsonGeometry;
}

export interface MapboxMouseEvent {
  point: { x: number; y: number };
  features?: MapboxFeature[];
}

export interface MapboxMap {
  addControl(control: unknown, position?: string): void;
  addLayer(layer: unknown): void;
  addSource(id: string, source: unknown): void;
  fitBounds(bounds: [LngLatTuple, LngLatTuple], options?: Record<string, unknown>): void;
  getCanvas(): HTMLCanvasElement;
  getLayer(id: string): unknown;
  getSource(id: string): MapboxGeoJsonSource | undefined;
  off(event: string, layerId: string, listener: (event: MapboxMouseEvent) => void): void;
  off(event: string, listener: () => void): void;
  on(event: string, layerId: string, listener: (event: MapboxMouseEvent) => void): void;
  on(event: string, listener: () => void): void;
  remove(): void;
  resize(): void;
}

export interface MapboxPopup {
  addTo(map: MapboxMap): MapboxPopup;
  remove(): void;
  setHTML(html: string): MapboxPopup;
  setLngLat(lngLat: LngLatTuple): MapboxPopup;
}

export interface MapboxModule {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMap;
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
  Popup: new (options?: Record<string, unknown>) => MapboxPopup;
}

declare global {
  interface Window {
    mapboxgl?: MapboxModule;
  }
}

let mapboxPromise: Promise<MapboxModule> | null = null;

function ensureStylesheet() {
  if (document.getElementById(MAPBOX_STYLESHEET_ID)) {
    return;
  }

  const link = document.createElement("link");
  link.id = MAPBOX_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = MAPBOX_STYLESHEET_URL;
  document.head.appendChild(link);
}

export function loadMapbox(): Promise<MapboxModule> {
  if (window.mapboxgl) {
    return Promise.resolve(window.mapboxgl);
  }

  if (mapboxPromise) {
    return mapboxPromise;
  }

  ensureStylesheet();

  mapboxPromise = new Promise<MapboxModule>((resolve, reject) => {
    const existingScript = document.getElementById(MAPBOX_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.mapboxgl) {
        resolve(window.mapboxgl);
        return;
      }

      reject(new Error("Mapbox GL JS loaded without exposing window.mapboxgl."));
    };

    const handleError = () => {
      reject(new Error("Unable to load Mapbox GL JS from the CDN."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = MAPBOX_SCRIPT_ID;
    script.async = true;
    script.src = MAPBOX_SCRIPT_URL;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.body.appendChild(script);
  }).catch((error) => {
    mapboxPromise = null;
    throw error;
  });

  return mapboxPromise;
}
