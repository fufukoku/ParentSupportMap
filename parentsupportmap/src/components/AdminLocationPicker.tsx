import { useEffect, useRef, useState } from "react";
import {
  getGoogleMapId,
  loadGeocodingLibrary,
  loadMapsLibrary,
} from "../lib/maps";

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
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Map } = await loadMapsLibrary();
      await loadGeocodingLibrary();

      if (cancelled) return;
      if (!mapDivRef.current) return;

      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
      }

      if (!mapRef.current) {
        const map = new Map(mapDivRef.current, {
          center: { lat, lng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          mapId: getGoogleMapId(),
        });

        const marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          draggable: true,
          title: "Selected location",
        });

        map.addListener("click", async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const nextLat = e.latLng.lat();
          const nextLng = e.latLng.lng();

          marker.setPosition({ lat: nextLat, lng: nextLng });

          const nextAddress = await reverseGeocode(nextLat, nextLng, geocoderRef.current);
          onPick({
            lat: nextLat,
            lng: nextLng,
            address: nextAddress ?? address,
          });
        });

        marker.addListener("dragend", async () => {
          const pos = marker.getPosition();
          if (!pos) return;

          const nextLat = pos.lat();
          const nextLng = pos.lng();
          const nextAddress = await reverseGeocode(nextLat, nextLng, geocoderRef.current);

          onPick({
            lat: nextLat,
            lng: nextLng,
            address: nextAddress ?? address,
          });
        });

        mapRef.current = map;
        markerRef.current = marker;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, lat, lng, onPick]);

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
      const geocoder = geocoderRef.current ?? new google.maps.Geocoder();
      geocoderRef.current = geocoder;

      const result = await geocodeAddress(address.trim(), geocoder);

      if (!result) {
        setGeoErr("Address not found.");
        return;
      }

      const nextLat = result.geometry.location.lat();
      const nextLng = result.geometry.location.lng();

      markerRef.current?.setPosition({ lat: nextLat, lng: nextLng });
      mapRef.current?.panTo({ lat: nextLat, lng: nextLng });
      mapRef.current?.setZoom(16);

      onPick({
        lat: nextLat,
        lng: nextLng,
        address: result.formatted_address || address,
      });
    } catch (e: any) {
      setGeoErr(e?.message || "Failed to search address.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setGeoErr(null);

    try {
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

      const nextLat = pos.coords.latitude;
      const nextLng = pos.coords.longitude;
      const nextAddress = await reverseGeocode(
        nextLat,
        nextLng,
        geocoderRef.current ?? new google.maps.Geocoder()
      );

      markerRef.current?.setPosition({ lat: nextLat, lng: nextLng });
      mapRef.current?.panTo({ lat: nextLat, lng: nextLng });
      mapRef.current?.setZoom(16);

      onPick({
        lat: nextLat,
        lng: nextLng,
        address: nextAddress ?? address,
      });
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? "Location permission denied."
          : e?.code === 2
          ? "Location unavailable."
          : e?.code === 3
          ? "Location request timed out."
          : e?.message || "Failed to get current location.";
      setGeoErr(msg);
    } finally {
      setLocating(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={{ fontWeight: 900 }}>Location</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={useCurrentLocation}
            style={ghostBtn}
            disabled={locating}
          >
            {locating ? "Loading..." : "Use current location"}
          </button>

          <button
            type="button"
            onClick={searchAddress}
            style={searchBtn}
            disabled={searching}
          >
            {searching ? "Searching..." : "Search address"}
          </button>
        </div>
      </div>

      <div style={hint}>
        Search by address, use current location, or click / drag on the map to set the location.
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

async function geocodeAddress(
  address: string,
  geocoder: google.maps.Geocoder
): Promise<google.maps.GeocoderResult | null> {
  return await new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) {
        resolve(null);
        return;
      }
      resolve(results[0]);
    });
  });
}

async function reverseGeocode(
  lat: number,
  lng: number,
  geocoder: google.maps.Geocoder | null
): Promise<string | undefined> {
  if (!geocoder) return undefined;

  return await new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) {
        resolve(undefined);
        return;
      }
      resolve(results[0].formatted_address);
    });
  });
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

const ghostBtn: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "white",
  color: "#111827",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 800,
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
