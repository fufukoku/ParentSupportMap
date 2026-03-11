import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Shop, ServiceKey } from "../types";
import { SERVICE_META } from "../constants/serviceMeta";
import {
  SHOP_CATEGORY_META,
  getShopCategoryLabel,
} from "../constants/shopCategoryMeta";

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

  const category = shop?.category ?? "other";
  const categoryMeta = SHOP_CATEGORY_META[category];
  const categoryLabel = getShopCategoryLabel(lang, category);

  const containerStyle: CSSProperties = isNarrow
    ? {
        position: "fixed",
        left: 8,
        right: 8,
        bottom: 8,
        height: "84dvh",
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
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={categoryPill}>
                  <span>{categoryMeta.emoji}</span>
                  <span>{categoryLabel}</span>
                </div>

                <div style={styles.name}>{shop?.name ?? ""}</div>

                {shop?.address ? (
                  <div style={styles.addr}>{shop.address}</div>
                ) : null}

                <div style={summaryRow}>
                  <span style={summaryPill}>
                    {lang === "ja" ? "対応" : "Available"} {serviceCount}/9
                  </span>
                </div>
              </div>

              <button onClick={onClose} type="button" style={styles.close} aria-label="Close">
                ✕
              </button>
            </div>

            <div style={styles.body}>
              {photos.length > 0 ? (
                <div style={heroWrap}>
                  <img
                    src={photos[Math.min(photoIndex, photos.length - 1)]}
                    alt={shop?.name ?? "shop photo"}
                    style={heroImage}
                  />
                </div>
              ) : null}

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

              <div style={{ marginTop: photos.length > 0 ? 12 : 0 }}>
                <div style={sectionHead}>
                  <div style={sectionTitle}>{t[lang].servicesTitle}</div>
                  <div style={sectionMeta}>{serviceCount} / 9</div>
                </div>

                <div style={serviceGrid}>
                  {(Object.keys(shop!.services) as ServiceKey[]).map((key) => {
                    const active = Boolean(shop!.services[key]);
                    return (
                      <div key={key} style={serviceCard(active)}>
                        <div style={serviceIconBox(active)}>
                          <span style={{ fontSize: 22 }}>{SERVICE_META[key].emoji}</span>
                        </div>

                        <div style={serviceTextWrap}>
                          <div style={serviceName}>
                            {getCompactServiceLabel(lang, key)}
                          </div>
                          <div style={serviceStatus(active)}>
                            {active
                              ? lang === "ja"
                                ? "あり"
                                : "Yes"
                              : lang === "ja"
                              ? "なし"
                              : "No"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {shop?.note ? (
                <div style={{ marginTop: 16 }}>
                  <div style={sectionTitle}>{t[lang].note}</div>
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

function getCompactServiceLabel(lang: Lang, key: ServiceKey): string {
  if (lang === "ja") {
    const ja: Record<ServiceKey, string> = {
      diaper_change: "おむつ交換",
      diaper_trash: "おむつゴミ箱",
      kids_toilet: "子どもトイレ",
      nursing_room: "授乳スペース",
      stroller_access: "ベビーカー",
      kids_chair_tableware: "椅子・食器",
      parking_car: "駐車場",
      parking_bicycle: "駐輪場",
      hot_water: "お湯",
    };
    return ja[key];
  }

  const en: Record<ServiceKey, string> = {
    diaper_change: "Diaper change",
    diaper_trash: "Diaper bin",
    kids_toilet: "Kids toilet",
    nursing_room: "Nursing",
    stroller_access: "Stroller",
    kids_chair_tableware: "Kids chair",
    parking_car: "Car parking",
    parking_bicycle: "Bike parking",
    hot_water: "Hot water",
  };
  return en[key];
}

const categoryPill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontSize: 11,
  fontWeight: 800,
  color: "#334155",
  marginBottom: 8,
};

const summaryRow: CSSProperties = {
  marginTop: 8,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const summaryPill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  fontSize: 11,
  fontWeight: 800,
  color: "#1d4ed8",
};

const heroWrap: CSSProperties = {
  width: "100%",
  height: 132,
  borderRadius: 16,
  overflow: "hidden",
  background: "#f8fafc",
  border: "1px solid #eef0f6",
};

const heroImage: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbRow: CSSProperties = {
  marginTop: 8,
  display: "flex",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 2,
};

const thumbBtn = (active: boolean): CSSProperties => ({
  border: "1px solid " + (active ? "#93c5fd" : "#e5e7eb"),
  background: "white",
  borderRadius: 10,
  padding: 0,
  overflow: "hidden",
  cursor: "pointer",
  flex: "0 0 auto",
  boxShadow: active ? "0 6px 18px rgba(37,99,235,0.12)" : "none",
});

const thumbImg: CSSProperties = {
  width: 52,
  height: 40,
  objectFit: "cover",
  display: "block",
};

const sectionHead: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
};

const sectionTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: "#111827",
};

const sectionMeta: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#2563eb",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "4px 8px",
  flex: "0 0 auto",
};

const serviceGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const serviceCard = (active: boolean): CSSProperties => ({
  border: "1px solid " + (active ? "#bfdbfe" : "#e5e7eb"),
  background: active ? "#f8fbff" : "#ffffff",
  borderRadius: 16,
  padding: "10px 8px",
  minHeight: 108,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  textAlign: "center",
});

const serviceIconBox = (active: boolean): CSSProperties => ({
  width: 46,
  height: 46,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: active ? "#eff6ff" : "#f8fafc",
  border: "1px solid " + (active ? "#bfdbfe" : "#e5e7eb"),
  flex: "0 0 auto",
});

const serviceTextWrap: CSSProperties = {
  marginTop: 8,
  minWidth: 0,
};

const serviceName: CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const serviceStatus = (active: boolean): CSSProperties => ({
  marginTop: 4,
  fontSize: 11,
  fontWeight: 800,
  color: active ? "#2563eb" : "#94a3b8",
});

const styles: Record<string, CSSProperties> = {
  top: {
    padding: 12,
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
    lineHeight: 1.2,
    color: "#111827",
  },
  addr: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  close: {
    border: "1px solid #e7e9f0",
    background: "white",
    borderRadius: 16,
    width: 42,
    height: 42,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    flex: "0 0 auto",
    color: "#2563eb",
    fontSize: 22,
    lineHeight: 1,
  },
  body: {
    padding: 12,
    overflowY: "auto",
    height: "calc(100% - 118px)",
    WebkitOverflowScrolling: "touch",
  },
  note: {
    fontSize: 13,
    color: "#374151",
    marginTop: 8,
    lineHeight: 1.55,
    background: "#f9fafb",
    border: "1px solid #eef0f6",
    borderRadius: 14,
    padding: 12,
  },
};
