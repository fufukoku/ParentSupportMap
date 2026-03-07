import { useEffect, useMemo, useRef, useState } from "react";
import type { Shop, ServiceKey } from "../types";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import { loadGoogleMaps } from "../lib/maps";
import { SERVICE_META } from "../constants/serviceMeta";

type Props = {
  lang: Lang;
  shops: Shop[];
  onSelect: (shop: Shop) => void;
};

const TOP_SERVICE_KEYS: ServiceKey[] = [
  "diaper_change",
  "nursing_room",
  "stroller_access",
  "kids_toilet",
  "hot_water",
];

export default function MapView({ lang, shops, onSelect }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const meMarkerRef = useRef<google.maps.Marker | null>(null);

  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [isTouchLike, setIsTouchLike] = useState(false);

  const previewOpenedShopIdRef = useRef<string | null>(null);

  const center = useMemo(() => ({ lat: 35.6762, lng: 139.6503 }), []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouchLike(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadGoogleMaps();
      if (cancelled) return;
      if (!mapDivRef.current) return;

      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      if (!infoWindowRef.current) {
        infoWindowRef.current = new google.maps.InfoWindow();
      }

      const map = mapRef.current;
      const infoWindow = infoWindowRef.current;
      const nextKeys = new Set<string>();

      for (const s of shops) {
        const key = s.id ? String(s.id) : `${s.name}-${s.lat}-${s.lng}`;
        nextKeys.add(key);

        let marker = markersRef.current.get(key);
        if (!marker) {
          marker = new google.maps.Marker({
            map,
            position: { lat: s.lat, lng: s.lng },
            title: s.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });

          marker.addListener("click", () => {
            if (isTouchLike) {
              const samePreview = previewOpenedShopIdRef.current === s.id;
              if (samePreview) {
                previewOpenedShopIdRef.current = null;
                infoWindow.close();
                onSelect(s);
                return;
              }

              previewOpenedShopIdRef.current = s.id;
              infoWindow.setContent(buildPreviewHtml(lang, s, true));
              infoWindow.open({ map, anchor: marker! });
              return;
            }

            onSelect(s);
            infoWindow.setContent(buildPreviewHtml(lang, s, false));
            infoWindow.open({ map, anchor: marker! });
          });

          marker.addListener("mouseover", () => {
            if (isTouchLike) return;
            infoWindow.setContent(buildPreviewHtml(lang, s, false));
            infoWindow.open({ map, anchor: marker! });
          });

          marker.addListener("mouseout", () => {
            if (isTouchLike) return;
            setTimeout(() => infoWindow.close(), 120);
          });

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
  }, [lang, shops, onSelect, center, isTouchLike]);

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

      map.panTo(p);
      map.setZoom(Math.max(map.getZoom() ?? 12, 16));

      if (!meMarkerRef.current) {
        meMarkerRef.current = new google.maps.Marker({
          map,
          position: p,
          title: t[lang].map.locateMe,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#111827",
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

      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
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
          aria-label={t[lang].map.locateMe}
          title={t[lang].map.locateMe}
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

function buildPreviewHtml(lang: Lang, shop: Shop, touchLike: boolean): string {
  const services = TOP_SERVICE_KEYS.filter((k) => Boolean(shop.services?.[k])).slice(0, 2);

  const chips = services
    .map((k) => {
      const emoji = SERVICE_META[k].emoji;
      const label = t[lang].services[k];
      return `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;font-size:11px;font-weight:700;color:#1d4ed8;">${emoji} ${escapeHtml(
        label
      )}</span>`;
    })
    .join(" ");

  const img = shop.photos?.[0]
    ? `<img src="${escapeAttr(shop.photos[0])}" alt="${escapeAttr(shop.name)}" style="width:100%;height:96px;object-fit:cover;display:block;border-radius:12px;" />`
    : `<div style="width:100%;height:96px;border-radius:12px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:26px;">📍</div>`;

  return `
    <div style="width:220px;padding:4px 4px 2px 4px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
      ${img}
      <div style="margin-top:10px;font-size:14px;font-weight:900;color:#111827;line-height:1.3;">${escapeHtml(shop.name)}</div>
      ${
        shop.address
          ? `<div style="margin-top:4px;font-size:12px;color:#6b7280;line-height:1.4;">${escapeHtml(shop.address)}</div>`
          : ""
      }
      ${chips ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${chips}</div>` : ""}
      <div style="margin-top:8px;font-size:11px;color:#2563eb;font-weight:700;">${
        touchLike ? t[lang].map.previewTapAgain : t[lang].map.previewClickDetails
      }</div>
    </div>
  `;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}