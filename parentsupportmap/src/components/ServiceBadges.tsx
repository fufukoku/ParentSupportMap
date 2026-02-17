import type { ServiceKey, Services } from "../types";
import type { Lang } from "../i18n";
import { t } from "../i18n";

const order: ServiceKey[] = [
  "diaper_change",
  "diaper_trash",
  "kids_toilet",
  "nursing_room",
  "stroller_access",
  "kids_chair_tableware",
  "parking_car",
  "parking_bicycle",
  "hot_water"
];

export default function ServiceBadges({
  lang,
  services
}: {
  lang: Lang;
  services: Services;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {order.map((k) => {
        const ok = services[k];
        return (
          <div
            key={k}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 12
            }}
          >
            <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>
              {ok ? "✅" : "❌"}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {t[lang].services[k]}
              </span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {ok ? t[lang].yes : t[lang].no}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}