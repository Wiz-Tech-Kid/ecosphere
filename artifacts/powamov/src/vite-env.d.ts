/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_MAPBOX_STYLE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __POWAMOV_MAPBOX_TOKEN__: string | undefined;
declare const __POWAMOV_MAPBOX_STYLE_URL__: string | undefined;
