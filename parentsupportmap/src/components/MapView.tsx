import { useEffect, useMemo, useRef, useState } from "react";
import type { Shop, ServiceKey, ShopCategory } from "../types";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import {
  loadMapsLibrary,
  loadMarkerLibrary,
  getGoogleMapId,
} from "../lib/maps";
import { SERVICE_META } from "../constants/serviceMeta";
import {
  SHOP_CATEGORY_META,
  getShopCategoryLabel,
} from "../constants/shopCategoryMeta";

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

type MarkerEntry = {
  marker: google.maps.marker.AdvancedMarkerElement;
  node: HTMLDivElement;
};

const CATEGORY_COLORS: Record<
  ShopCategory,
  { bg: string; ring: string; fg: string }
> = {
  restaurant: {
    bg: "#fff7ed",
    ring: "#fdba74",
    fg: "#c2410c",
  },
  cafe: {
    bg: "#fef3c7",
    ring: "#fcd34d",
    fg: "#92400e",
  },
  supermarket: {
    bg: "#ecfdf5",
    ring: "#86efac",
    fg: "#166534",
  },
  drugstore: {
    bg: "#eff6ff",
    ring: "#93c5fd",
    fg: "#1d4ed8",
  },
  shopping_mall: {
    bg: "#f5f3ff",
    ring: "#c4b5fd",
    fg: "#6d28d9",
  },
  public_facility: {
    bg: "#f1f5f9",
    ring: "#cbd5e1",
    fg: "#334155",
  },
  baby_goods: {
    bg: "#fdf2f8",
    ring: "#f9a8d4",
    fg: "#be185d",
  },
  other: {
    bg: "#eff6ff",
    ring: "#93c5fd",
    fg: "#2563eb",
  },
};

export default function MapView({ lang, shops, onSelect }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const meMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [isTouchLike, setIsTouchLike] = useState(false);

  const previewOpenedShopIdRef = useRef<string | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);

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
      const { Map, InfoWindow } = await loadMapsLibrary();
      const { AdvancedMarkerElement } = await loadMarkerLibrary();

      if (cancelled) return;
      if (!mapDivRef.current) return;

      if (!mapRef.current) {
        mapRef.current = new Map(mapDivRef.current, {
          center,
          zoom: 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          mapId: getGoogleMapId(),
          gestureHandling: isTouchLike ? "cooperative" : "greedy",
        });
      } else {
        mapRef.current.setOptions({
          gestureHandling: isTouchLike ? "cooperative" : "greedy",
        });
      }

      if (!infoWindowRef.current) {
        infoWindowRef.current = new InfoWindow();
      }

      const map = mapRef.current;
      const infoWindow = infoWindowRef.current;

      for (const { marker } of markersRef.current.values()) {
        marker.map = null;
      }
      markersRef.current.clear();

      for (const s of shops) {
        const key = s.id ? String(s.id) : `${s.name}-${s.lat}-${s.lng}`;
        const node = createShopMarkerNode(s);

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: s.lat, lng: s.lng },
          title: s.name,
          content: node,
        });

        const openPreview = () => {
          infoWindow.setContent(buildPreviewHtml(lang, s, isTouchLike));
          infoWindow.open({
            map,
            anchor: marker,
          });
        };

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
            openPreview();
            return;
          }

          onSelect(s);
          openPreview();
        });

        node.addEventListener("mouseenter", () => {
          if (isTouchLike) return;
          if (hoverCloseTimerRef.current) {
            window.clearTimeout(hoverCloseTimerRef.current);
            hoverCloseTimerRef.current = null;
          }
          openPreview();
        });

        node.addEventListener("mouseleave", () => {
          if (isTouchLike) return;
          hoverCloseTimerRef.current = window.setTimeout(() => {
            infoWindow.close();
          }, 120);
        });

        markersRef.current.set(key, { marker, node });
      }
    })();

    return () => {
      cancelled = true;
      if (hoverCloseTimerRef.current) {
        window.clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, [lang, shops, onSelect, center, isTouchLike]);

  const locateMe = async () => {
    setLocErr(null);
    setLocating(true);

    try {
      await loadMapsLibrary();
      const { AdvancedMarkerElement } = await loadMarkerLibrary();

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
        meMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: p,
          title: t[lang].map.locateMe,
          content: createMeMarkerNode(),
        });
      } else {
        meMarkerRef.current.position = p;
        meMarkerRef.current.map = map;
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

function createShopMarkerNode(shop: Shop): HTMLDivElement {
  const category = shop.category ?? "other";
  const meta = SHOP_CATEGORY_META[category];
  const color = CATEGORY_COLORS[category];

  const outer = document.createElement("div");
  outer.style.width = "46px";
  outer.style.height = "46px";
  outer.style.display = "flex";
  outer.style.alignItems = "center";
  outer.style.justifyContent = "center";
  outer.style.cursor = "pointer";
  outer.style.transform = "translateY(-4px)";

  const inner = document.createElement("div");
  inner.style.width = "38px";
  inner.style.height = "38px";
  inner.style.borderRadius = "999px";
  inner.style.display = "flex";
  inner.style.alignItems = "center";
  inner.style.justifyContent = "center";
  inner.style.background = color.bg;
  inner.style.border = `2px solid ${color.ring}`;
  inner.style.boxShadow = "0 10px 20px rgba(15,23,42,0.18)";
  inner.style.fontSize = "18px";
  inner.style.lineHeight = "1";
  inner.style.userSelect = "none";
  inner.title = `${meta.emoji} ${shop.name}`;

  inner.textContent = meta.emoji;
  outer.appendChild(inner);

  return outer;
}

function createMeMarkerNode(): HTMLDivElement {
  const outer = document.createElement("div");
  outer.style.width = "26px";
  outer.style.height = "26px";
  outer.style.borderRadius = "999px";
  outer.style.background = "#2563eb";
  outer.style.border = "4px solid white";
  outer.style.boxShadow = "0 8px 18px rgba(0,0,0,0.18)";
  return outer;
}

function buildPreviewHtml(lang: Lang, shop: Shop, touchLike: boolean): string {
  const services = TOP_SERVICE_KEYS.filter((k) => Boolean(shop.services?.[k])).slice(0, 2);
  const category = shop.category ?? "other";
  const categoryMeta = SHOP_CATEGORY_META[category];
  const categoryLabel = getShopCategoryLabel(lang, category);

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
    ? `<img src="${escapeAttr(shop.photos[0])}" alt="${escapeAttr(
        shop.name
      )}" style="width:100%;height:96px;object-fit:cover;display:block;border-radius:12px;" />`
    : `<div style="width:100%;height:96px;border-radius:12px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:26px;">📍</div>`;

  return `
    <div style="width:220px;padding:4px 4px 2px 4px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
      ${img}
      <div style="margin-top:10px;">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:800;color:#334155;">
          ${categoryMeta.emoji} ${escapeHtml(categoryLabel)}
        </span>
      </div>
      <div style="margin-top:10px;font-size:14px;font-weight:900;color:#111827;line-height:1.3;">${escapeHtml(
        shop.name
      )}</div>
      ${
        shop.address
          ? `<div style="margin-top:4px;font-size:12px;color:#6b7280;line-height:1.4;">${escapeHtml(
              shop.address
            )}</div>`
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
