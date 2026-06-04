/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OLA_MAPS_API_KEY: string
  readonly VITE_DEFAULT_MAP_CENTER_LNG: string
  readonly VITE_DEFAULT_MAP_CENTER_LAT: string
  readonly VITE_DEFAULT_MAP_ZOOM: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}