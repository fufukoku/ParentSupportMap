import type { Shop } from "../types";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import ServiceBadges from "./ServiceBadges";

export default function ShopDrawer({
  lang,
  shop,
  onClose
}: {
  lang: Lang;
  shop: Shop | null;
  onClose: () => void;
}) {
  const open = !!shop;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 420,
        maxWidth: "92vw",
        height: "calc(100% - 32px)",
        background: "white",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        overflow: "hidden",
        transform: open ? "translateX(0)" : "translateX(110%)",
        transition: "transform 180ms ease",
        pointerEvents: open ? "auto" : "none"
      }}
      aria-hidden={!open}
    >
      <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {shop?.name ?? ""}
            </div>
            {shop?.address && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                {t[lang].address}: {shop.address}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "white",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ padding: 14, overflowY: "auto", height: "100%" }}>
        {/* Photos */}
        {shop?.photos?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {shop.photos.slice(0, 4).map((p) => (
              <img
                key={p}
                src={p}
                alt={shop.name}
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb"
                }}
              />
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: 14, fontSize: 14, fontWeight: 700 }}>
          {t[lang].servicesTitle}
        </div>

        {shop ? <div style={{ marginTop: 10 }}>
          <ServiceBadges lang={lang} services={shop.services} />
        </div> : null}

        {shop?.note && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{t[lang].note}</div>
            <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>
              {shop.note}
            </div>
          </div>
        )}
      </div>