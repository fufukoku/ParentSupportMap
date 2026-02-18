import { useEffect, useMemo, useRef, useState } from "react";
import type { Shop } from "../types";
import { loadGoogleMaps } from "../lib/maps";

type Props = {
  shops: Shop[];
  onSelect: (shop: Shop) => void;
};

export default function MapView({ shops, onSelect }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // ✅ "我的位置" marker（用经典 Marker，不依赖 mapId）
  const meMarkerRef = useRef<google.maps.Marker | null>(null);

  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);

  const center = useMemo(() => ({ lat: 35.6762, lng: 139.6503 }), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadGoogleMaps();
      if (cancelled) return;
      if (!mapDivRef.current) return;

      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      const map = mapRef.current;
      const nextKeys = new Set<string>();

      for (const s of shops) {
        const key = (s as any).id ? String((s as any).id) : `${s.name}-${s.lat}-${s.lng}`;
        nextKeys.add(key);

        let marker = markersRef.current.get(key);
        if (!marker) {
          marker = new google.maps.Marker({
            map,
            position: { lat: s.lat, lng: s.lng },
            title: s.name,
          });
          marker.addListener("click", () => onSelect(s));
          markersRef.current.set(key, marker);
        } else {
          marker.setPosition({ lat: s.lat, lng: s.lng });
          marker.setTitle(s.name);
          marker.setMap(map);
        }
      }

      for (const [k, m] of markersRef.current.entries()) {
        if (!nextKeys.has(k)) {
          m.setMap(null);
          markersRef.current.delete(k);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shops, onSelect, center]);

  // ✅ 点击定位
  const locateMe = async () => {
    setLocErr(null);
    setLocating(true);

    try {
      await loadGoogleMaps();
      const map = mapRef.current;
      if (!map) throw new Error("Map not initialized yet");

      if (!("geolocation" in navigator)) {
        throw new Error("This browser does not support geolocation.");
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const p = { lat, lng };

      // 移动视角
      map.panTo(p);
      map.setZoom(Math.max(map.getZoom() ?? 12, 16));

      // 放/更新我的 marker
      if (!meMarkerRef.current) {
        meMarkerRef.current = new google.maps.Marker({
          map,
          position: p,
          title: "You are here",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 9999,
        });
      } else {
        meMarkerRef.current.setPosition(p);
        meMarkerRef.current.setMap(map);
      }
    } catch (e: any) {
      // 常见权限/超时错误提示
      const msg =
        e?.code === 1
          ? "Location permission denied. Please allow location access in the browser."
          : e?.code === 2
          ? "Location unavailable."
          : e?.code === 3
          ? "Location request timed out."
          : e?.message || "Failed to get current location.";
      setLocErr(msg);
    } finally {
      setLocating(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapDivRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 420,
          borderRadius: 12,
          overflow: "hidden",
          background: "#f3f4f6",
        }}
      />

      {/* ✅ 左下角定位按钮 */}
      <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 5, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "white",
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            cursor: locating ? "not-allowed" : "pointer",
            fontSize: 18,
            fontWeight: 900,
          }}
          aria-label="Locate me"
          title="Locate me"
        >
          {locating ? "…" : "📍"}
        </button>

        {locErr ? (
          <div
            style={{
              maxWidth: 260,
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid #fee2e2",
              background: "#fff1f2",
              color: "#9f1239",
              fontSize: 12,
              lineHeight: 1.4,
              boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
            }}
          >
            {locErr}
          </div>
        ) : null}
      </div>
    </div>
  );
}
