const injectedMapboxToken =
  typeof __POWAMOV_MAPBOX_TOKEN__ === "string" ? __POWAMOV_MAPBOX_TOKEN__ : "";

const injectedMapboxStyleUrl =
  typeof __POWAMOV_MAPBOX_STYLE_URL__ === "string" ? __POWAMOV_MAPBOX_STYLE_URL__ : "";

function cleanOptionalValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export function getMapboxToken(): string | undefined {
  return cleanOptionalValue(injectedMapboxToken) ?? cleanOptionalValue(import.meta.env.VITE_MAPBOX_TOKEN);
}

export function getMapboxStyleUrl(): string {
  return (
    cleanOptionalValue(injectedMapboxStyleUrl) ??
    cleanOptionalValue(import.meta.env.VITE_MAPBOX_STYLE_URL) ??
    "mapbox://styles/mapbox/dark-v11"
  );
}
