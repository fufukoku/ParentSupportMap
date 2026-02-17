import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export function getMapsApiKey(): string {
  const k = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!k) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env.local");
  return k as string;
}

let configured = false;

export async function loadGoogleMaps() {
  if (!configured) {

    setOptions({
      key: getMapsApiKey(),
      v: "weekly",

    });
    configured = true;
  }

  await importLibrary("maps");
  await importLibrary("marker");
}
