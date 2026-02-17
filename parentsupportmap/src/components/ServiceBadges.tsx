import type { CSSProperties } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Shop } from "../types";

type ShopServices = Shop["services"];

export default function ServiceBadges({
  lang,
  services,
}: {
  lang: Lang;
  services: ShopServices;
}) {
  // ✅ snake_case keys
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
        <div key={it.key} style={card}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={icon(it.ok)} aria-hidden>
              {it.ok ? "✓" : "✕"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={label}>{it.label}</div>
              <div style={sub(it.ok)}>{it.ok ? t[lang].yes : t[lang].no}</div>
            </div>
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

const card: CSSProperties = {
  border: "1px solid #eef0f6",
  borderRadius: 14,
  padding: 12,
  background: "white",
};

const icon = (ok: boolean): CSSProperties => ({
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  border: "1px solid " + (ok ? "#d1fae5" : "#fee2e2"),
  background: ok ? "#ecfdf5" : "#fff1f2",
  color: ok ? "#065f46" : "#9f1239",
  flex: "0 0 auto",
});

const label: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const sub = (ok: boolean): CSSProperties => ({
  marginTop: 4,
  fontSize: 12,
  color: ok ? "#065f46" : "#9ca3af",
});