import { useEffect, useMemo, useRef } from "react";
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
        const key =
          (s as any).id ? String((s as any).id) : `${s.name}-${s.lat}-${s.lng}`;
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

  return (
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
  );
}
