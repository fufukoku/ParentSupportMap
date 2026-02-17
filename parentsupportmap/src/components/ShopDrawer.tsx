import { useEffect, useState } from "react";
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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 桌面：右侧栏内部渲染（不遮地图）
  // 窄屏：bottom sheet（覆盖在地图上方，但占比合理）
  const containerStyle: CSSProperties = isNarrow
    ? {
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        height: "70vh",
        borderRadius: 18,
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
        opacity: open ? 1 : 0.55,
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
              <div style={styles.sectionTitle}>{t[lang].servicesTitle}</div>
              <div style={{ marginTop: 10 }}>
                <ServiceBadges lang={lang} services={shop!.services} />
              </div>

              {shop?.note ? (
                <div style={{ marginTop: 14 }}>
                  <div style={styles.sectionTitle}>{t[lang].note}</div>
                  <div style={styles.note}>{shop.note}</div>
                </div>
              ) : null}

              <div style={styles.footerHint}>{t[lang].demoDataOnly}</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function EmptyState({ lang }: { lang: Lang }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 14 }}>{t[lang].howToTitle}</div>
      <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
        {t[lang].howToBody}
      </div>
    </div>
  );
}

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
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  addr: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  close: {
    border: "1px solid #e7e9f0",
    background: "white",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  body: { padding: 14, overflowY: "auto", height: "calc(100% - 62px)" },
  sectionTitle: { fontSize: 13, fontWeight: 900, color: "#111827" },
  note: { fontSize: 13, color: "#374151", marginTop: 6, lineHeight: 1.55 },
  footerHint: { marginTop: 14, fontSize: 12, color: "#9ca3af" },
};