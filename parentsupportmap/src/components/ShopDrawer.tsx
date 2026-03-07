import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Shop } from "../types";
import ServiceBadges from "./ServiceBadges";

export default function ShopDrawer({
  lang,
  shop,
  onClose,
}: {
  lang: Lang;
  shop: Shop | null;
  onClose: () => void;
}) {
  const open = !!shop;
  const [isNarrow, setIsNarrow] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setPhotoIndex(0);
  }, [shop?.id]);

  const photos = useMemo(() => shop?.photos ?? [], [shop?.photos]);

  const serviceCount = useMemo(() => {
    if (!shop) return 0;
    return Object.values(shop.services ?? {}).filter(Boolean).length;
  }, [shop]);

  const containerStyle: CSSProperties = isNarrow
    ? {
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        height: "82vh",
        borderRadius: 20,
        border: "1px solid #e7e9f0",
        background: "white",
        boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
        overflow: "hidden",
        transform: open ? "translateY(0)" : "translateY(120%)",
        transition: "transform 180ms ease",
        zIndex: 50,
        pointerEvents: open ? "auto" : "none",
      }
    : {
        height: "100%",
        overflow: "hidden",
        opacity: open ? 1 : 0.6,
      };

  return (
    <>
      {isNarrow && open ? (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.35)",
            zIndex: 40,
          }}
        />
      ) : null}

      <div style={containerStyle} aria-hidden={!open}>
        {!open ? (
          <EmptyState lang={lang} />
        ) : (
          <>
            <div style={styles.top}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.name}>{shop?.name ?? ""}</div>
                {shop?.address ? (
                  <div style={styles.addr}>
                    {t[lang].address}: {shop.address}
                  </div>
                ) : null}
              </div>

              <button onClick={onClose} type="button" style={styles.close} aria-label="Close">
                ✕
              </button>
            </div>

            <div style={styles.body}>
              <div style={heroWrap}>
                {photos.length > 0 ? (
                  <img
                    src={photos[Math.min(photoIndex, photos.length - 1)]}
                    alt={shop?.name ?? "shop photo"}
                    style={heroImage}
                  />
                ) : (
                  <div style={heroEmpty}>
                    <div style={{ fontSize: 30 }}>📍</div>
                    <div style={{ marginTop: 8, fontWeight: 800, color: "#374151" }}>
                      {lang === "ja" ? "画像はまだありません" : "No photos yet"}
                    </div>
                  </div>
                )}
              </div>

              {photos.length > 1 ? (
                <div style={thumbRow}>
                  {photos.map((p: string, idx: number) => (
                    <button
                      key={`${p}-${idx}`}
                      type="button"
                      onClick={() => setPhotoIndex(idx)}
                      style={thumbBtn(idx === photoIndex)}
                    >
                      <img src={p} alt={`${shop?.name ?? "shop"} ${idx + 1}`} style={thumbImg} />
                    </button>
                  ))}
                </div>
              ) : null}

              <div style={{ marginTop: 16 }}>
                <div style={styles.sectionHead}>
                  <div style={styles.sectionTitle}>{t[lang].servicesTitle}</div>
                  <div style={styles.sectionMeta}>
                    {serviceCount} / 9
                  </div>
                </div>

                <div style={styles.sectionHint}>
                  {lang === "ja"
                    ? "下にスクロールすると、すべてのサービス項目を確認できます。"
                    : "Scroll down to view all service items."}
                </div>

                <div style={{ marginTop: 10 }}>
                  <ServiceBadges lang={lang} services={shop!.services} />
                </div>
              </div>

              {shop?.note ? (
                <div style={{ marginTop: 16 }}>
                  <div style={styles.sectionTitle}>{t[lang].note}</div>
                  <div style={styles.note}>{shop.note}</div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function EmptyState({ lang }: { lang: Lang }) {
  return (
    <div style={{ padding: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 15 }}>{t[lang].howToTitle}</div>
      <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
        {t[lang].howToBody}
      </div>
    </div>
  );
}

const heroWrap: CSSProperties = {
  width: "100%",
  borderRadius: 18,
  overflow: "hidden",
  background: "#f8fafc",
  border: "1px solid #eef0f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  aspectRatio: "16 / 9",
  maxHeight: 240,
};

const heroImage: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
  background: "#f8fafc",
};

const heroEmpty: CSSProperties = {
  height: 220,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
};

const thumbRow: CSSProperties = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 2,
};

const thumbBtn = (active: boolean): CSSProperties => ({
  border: "1px solid " + (active ? "#93c5fd" : "#e5e7eb"),
  background: "white",
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  cursor: "pointer",
  flex: "0 0 auto",
  boxShadow: active ? "0 6px 18px rgba(37,99,235,0.12)" : "none",
});

const thumbImg: CSSProperties = {
  width: 72,
  height: 54,
  objectFit: "cover",
  display: "block",
};

const styles: Record<string, CSSProperties> = {
  top: {
    padding: 14,
    borderBottom: "1px solid #eef0f6",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfbfe 100%)",
  },
  name: {
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.25,
    color: "#111827",
  },
  addr: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 1.45,
  },
  close: {
    border: "1px solid #e7e9f0",
    background: "white",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    flex: "0 0 auto",
  },
  body: {
  padding: 14,
  overflowY: "auto",
  height: "calc(100% - 76px)",
  WebkitOverflowScrolling: "touch",
},
  sectionTitle: { fontSize: 13, fontWeight: 900, color: "#111827" },
  note: {
    fontSize: 13,
    color: "#374151",
    marginTop: 8,
    lineHeight: 1.65,
    background: "#f9fafb",
    border: "1px solid #eef0f6",
    borderRadius: 14,
    padding: 12,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: 800,
    color: "#2563eb",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 999,
    padding: "4px 8px",
    flex: "0 0 auto",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.4,
  },
};