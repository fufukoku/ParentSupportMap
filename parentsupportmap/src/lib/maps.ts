let loadingPromise: Promise<void> | null = null;

function getMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env.local");
  return key;
}

/**
 * Loads Google Maps JS API using the recommended new API (importLibrary).
 * - No deprecated Loader class
 * - Works with Vite
 */
export async function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return;
  if ((window as any).google?.maps) return;

  if (!loadingPromise) {
    loadingPromise = new Promise<void>((resolve, reject) => {
      const key = getMapsApiKey();

      // If script already exists, reuse it.
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
        return;
      }

      // Create script tag
      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.async = true;
      script.defer = true;

      // IMPORTANT: do not set libraries=... here; we'll use importLibrary()
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps script"));
      document.head.appendChild(script);
    });
  }

  await loadingPromise;
}
