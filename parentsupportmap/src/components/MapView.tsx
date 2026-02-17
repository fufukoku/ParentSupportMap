import { useEffect, useRef } from "react";
import type { Shop } from "../types";
import { loadGoogleMaps } from "../lib/maps";

type Props = {
  shops: Shop[];
  onSelect: (shop: Shop) => void;
};

export default function MapView({ shops, onSelect }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadGoogleMaps();
      if (cancelled) return;

      const center = { lat: 35.6762, lng: 139.6503 }; // Tokyo
      const map = new google.maps.Map(mapDivRef.current as HTMLDivElement, {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      mapRef.current = map;

      // create markers
      markersRef.current = shops.map((s) => {
        const m = new google.maps.Marker({
          position: { lat: s.lat, lng: s.lng },
          map,
          title: s.name
        });
        m.addListener("click", () => onSelect(s));
        return m;
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [shops, onSelect]);

  return (
    <div
      ref={mapDivRef}
      style={{ width: "100%", height: "100%", minHeight: 420, borderRadius: 12 }}
    />
  );
}