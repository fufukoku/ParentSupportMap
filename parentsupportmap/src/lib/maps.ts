let loadingPromise: Promise<void> | null = null;

function getMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env.local");
  return key;
}

/**
 * Loads Google Maps JS API
 * - Vite friendly
 * - Adds loading=async to match best practice warning
 * - Does NOT require mapId (so classic Marker works fine)
 */
export async function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return;
  if ((window as any).google?.maps) return;

  if (!loadingPromise) {
    loadingPromise = new Promise<void>((resolve, reject) => {
      const key = getMapsApiKey();

      const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
      if (existing) {
        // 如果已经在加载了，挂上事件即可
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.async = true;
      script.defer = true;

      // ✅ 加 loading=async，消掉性能提示 warning
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        key
      )}&v=weekly&loading=async`;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps script"));
      document.head.appendChild(script);
    });
  }

  await loadingPromise;
}