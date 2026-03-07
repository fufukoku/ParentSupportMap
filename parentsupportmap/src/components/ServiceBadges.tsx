import type { CSSProperties } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Shop } from "../types";
import { SERVICE_META } from "../constants/serviceMeta";

type ShopServices = Shop["services"];

export default function ServiceBadges({
  lang,
  services,
}: {
  lang: Lang;
  services: ShopServices;
}) {
  const items = [
    { key: "diaper_change", ok: services.diaper_change, label: t[lang].services.diaper_change },
    { key: "diaper_trash", ok: services.diaper_trash, label: t[lang].services.diaper_trash },
    { key: "kids_toilet", ok: services.kids_toilet, label: t[lang].services.kids_toilet },
    { key: "nursing_room", ok: services.nursing_room, label: t[lang].services.nursing_room },
    { key: "stroller_access", ok: services.stroller_access, label: t[lang].services.stroller_access },
    { key: "kids_chair_tableware", ok: services.kids_chair_tableware, label: t[lang].services.kids_chair_tableware },
    { key: "parking_car", ok: services.parking_car, label: t[lang].services.parking_car },
    { key: "parking_bicycle", ok: services.parking_bicycle, label: t[lang].services.parking_bicycle },
    { key: "hot_water", ok: services.hot_water, label: t[lang].services.hot_water },
  ] as const;

  return (
    <div style={grid}>
      {items.map((it) => (
        <div key={it.key} style={card(it.ok)}>
          <div style={row}>
            <div style={iconWrap(it.ok)} aria-hidden>
              <span style={emoji}>{SERVICE_META[it.key].emoji}</span>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={label}>{it.label}</div>
              <div style={sub(it.ok)}>{it.ok ? t[lang].yes : t[lang].no}</div>
            </div>

            <div style={status(it.ok)}>{it.ok ? "✓" : "—"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const card = (ok: boolean): CSSProperties => ({
  border: "1px solid " + (ok ? "#dbeafe" : "#eef0f6"),
  borderRadius: 16,
  padding: 12,
  background: ok ? "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" : "white",
  boxShadow: ok ? "0 8px 20px rgba(37,99,235,0.06)" : "none",
});

const row: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const iconWrap = (ok: boolean): CSSProperties => ({
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: ok ? "#eff6ff" : "#f9fafb",
  border: "1px solid " + (ok ? "#bfdbfe" : "#e5e7eb"),
  flex: "0 0 auto",
});

const emoji: CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
};

const label: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.35,
};

const sub = (ok: boolean): CSSProperties => ({
  marginTop: 4,
  fontSize: 12,
  color: ok ? "#2563eb" : "#9ca3af",
  fontWeight: 700,
});

const status = (ok: boolean): CSSProperties => ({
  marginLeft: "auto",
  fontSize: 14,
  fontWeight: 900,
  color: ok ? "#2563eb" : "#d1d5db",
  flex: "0 0 auto",
});