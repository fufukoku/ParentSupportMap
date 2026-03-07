import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/maps";

type Props = {
  lat: number;
  lng: number;
  address: string;
  onPick: (next: { lat: number; lng: number; address?: string }) => void;
};

export default function AdminLocationPicker({
  lat,
  lng,
  address,
  onPick,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [searching, setSearching] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadGoogleMaps();
      if (cancelled) return;
      if (!mapDivRef.current) return;

      geocoderRef.current = new google.maps.Geocoder();

      if (!mapRef.current) {
        const map = new google.maps.Map(mapDivRef.current, {
          center: { lat, lng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          draggable: true,
          title: "Selected location",
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const nextLat = e.latLng.lat();
          const nextLng = e.latLng.lng();

          marker.setPosition({ lat: nextLat, lng: nextLng });
          onPick({
            lat: nextLat,
            lng: nextLng,
          });
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          onPick({
            lat: pos.lat(),
            lng: pos.lng(),
          });
        });

        mapRef.current = map;
        markerRef.current = marker;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPick]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const pos = { lat, lng };
    marker.setPosition(pos);
    map.panTo(pos);
  }, [lat, lng]);

  const searchAddress = async () => {
    if (!address.trim()) {
      setGeoErr("Please enter an address first.");
      return;
    }

    setSearching(true);
    setGeoErr(null);

    try {
      await loadGoogleMaps();

      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
      }

      geocoderRef.current.geocode(
        { address: address.trim() },
        (results, status) => {
          setSearching(false);

          if (status !== "OK" || !results || !results[0]) {
            setGeoErr("Address not found.");
            return;
          }

          const first = results[0];
          const loc = first.geometry.location;
          const nextLat = loc.lat();
          const nextLng = loc.lng();

          markerRef.current?.setPosition({ lat: nextLat, lng: nextLng });
          mapRef.current?.panTo({ lat: nextLat, lng: nextLng });
          mapRef.current?.setZoom(16);

          onPick({
            lat: nextLat,
            lng: nextLng,
            address: first.formatted_address || address,
          });
        }
      );
    } catch (e: any) {
      setSearching(false);
      setGeoErr(e?.message || "Failed to search address.");
    }
  };

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={{ fontWeight: 900 }}>Location</div>
        <button
          type="button"
          onClick={searchAddress}
          style={searchBtn}
          disabled={searching}
        >
          {searching ? "Searching..." : "Search address"}
        </button>
      </div>

      <div style={hint}>
        Search by address, or click / drag on the map to set the location.
      </div>

      {geoErr ? <div style={errStyle}>{geoErr}</div> : null}

      <div
        ref={mapDivRef}
        style={{
          marginTop: 10,
          width: "100%",
          height: 280,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          background: "#f3f4f6",
        }}
      />
    </div>
  );
}

const wrap: React.CSSProperties = {
  marginTop: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 12,
  background: "#fcfcfd",
};

const head: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const hint: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: "#6b7280",
};

const searchBtn: React.CSSProperties = {
  border: "1px solid #2563eb",
  background: "#eff6ff",
  color: "#2563eb",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 800,
};

const errStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#b91c1c",
  fontSize: 13,
  background: "#fef2f2",
  border: "1px solid #fee2e2",
  padding: "8px 10px",
  borderRadius: 12,
};