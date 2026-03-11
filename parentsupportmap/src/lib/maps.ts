import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

function getMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY");
  return key;
}

export function getGoogleMapId(): string {
  return (
    (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ??
    "DEMO_MAP_ID"
  );
}

function ensureConfigured() {
  if (configured) return;

  setOptions({
    key: getMapsApiKey(),
    v: "weekly",
  });

  configured = true;
}

export async function loadGoogleMaps(): Promise<void> {
  ensureConfigured();
  await importLibrary("maps");
}

export async function loadMapsLibrary(): Promise<google.maps.MapsLibrary> {
  ensureConfigured();
  return (await importLibrary("maps")) as google.maps.MapsLibrary;
}

export async function loadMarkerLibrary(): Promise<google.maps.MarkerLibrary> {
  ensureConfigured();
  return (await importLibrary("marker")) as google.maps.MarkerLibrary;
}

export async function loadGeocodingLibrary(): Promise<google.maps.GeocodingLibrary> {
  ensureConfigured();
  return (await importLibrary("geocoding")) as google.maps.GeocodingLibrary;
}
