import { Loader } from "@googlemaps/js-api-loader";

export function getMapsApiKey(): string {
  const k = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!k) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env.local");
  return k as string;
}

export async function loadGoogleMaps() {
  const loader = new Loader({
    apiKey: getMapsApiKey(),
    version: "weekly",
  });

  return loader.load();
}