import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

import type { Shop, ServiceKey, Services } from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";

import MapView from "./components/MapView";
import ShopDrawer from "./components/ShopDrawer";
import FilterPanel from "./components/FilterPanel";

import type { Session } from "./repos/auth/types";
import { cognitoAuthRepo } from "./repos/auth/cognitoAuthRepo";

const LANG_KEY = "psm_lang";

const SERVICE_KEYS: ServiceKey[] = [
  "diaper_change",
  "diaper_trash",
  "kids_toilet",
  "nursing_room",
  "stroller_access",
  "kids_chair_tableware",
  "parking_car",
  "parking_bicycle",
  "hot_water",
];

function servicesFromArray(arr: any): Services {
  const set = new Set<string>(Array.isArray(arr) ? arr : []);
  const out: any = {};
  for (const k of SERVICE_KEYS) out[k] = set.has(k);
  return out as Services;
}

export default function App({
  session,
  onSessionChanged,
}: {
  session: Session | null;
  onSessionChanged: () => Promise<void> | void;
}) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" ? "en" : "ja";
  });

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceKey[]>([]);

  const API_BASE =
    (import.meta.env.VITE_API_BASE as string | undefined) ??
    "https://zzvcdp16u5.execute-api.ap-northeast-1.amazonaws.com/dev";

  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setShopsLoading(true);
      setShopsError(null);
      try {
        const res = await fetch(`${API_BASE}/shops`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const mapped = (data.items ?? []).map((a: any) => {
          const name = lang === "ja" ? a.nameJa || a.nameEn || "Unnamed" : a.nameEn || a.nameJa || "Unnamed";
          const note = lang === "ja" ? a.descriptionJa || a.descriptionEn || "" : a.descriptionEn || a.descriptionJa || "";
          return {
            id: a.shopId,
            name,
            lat: Number(a.lat ?? 0),
            lng: Number(a.lng ?? 0),
            address: a.address ?? "",
            photos: Array.isArray(a.imageUrls) ? a.imageUrls : [],
            services: servicesFromArray(a.services),
            note,
          } as Shop;
        });

        if (!cancelled) setShops(mapped);
      } catch (e: any) {
        if (!cancelled) setShopsError(e?.message || "Failed to load shops");
      } finally {
        if (!cancelled) setShopsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, lang]);

  const nav = useNavigate();
  const auth = useMemo(() => cognitoAuthRepo(), []);

  const filteredShops = useMemo(() => {
    if (selectedServices.length === 0) return shops;
    return shops.filter((s) => selectedServices.every((k) => Boolean(s.services?.[k])));
  }, [shops, selectedServices]);

  const logout = async () => {
    await auth.logout();
    await onSessionChanged();
  };

  const showSidePane = !isNarrow && !!selectedShop;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.brandBlock}>
            <div style={styles.brandEyebrow}>PARENTSUPPORTMAP</div>
            <div style={styles.title}>{t[lang].appTitle}</div>
            <div style={styles.sub}>{t[lang].appSubtitle}</div>
          </div>

          <div style={styles.headerActions}>
            <div style={styles.langBox}>
              <span style={styles.langLabel}>{t[lang].language}</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                style={styles.select}
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>

            {!session ? (
              <button type="button" onClick={() => nav("/login")} style={styles.primaryBtn}>
                {t[lang].header.login}
              </button>
            ) : (
              <div style={styles.sessionBox}>
                <span style={styles.sessionText}>{session.email}</span>

                {session.role === "admin" ? (
                  <button type="button" onClick={() => nav("/admin")} style={styles.authBtn}>
                    {t[lang].header.admin}
                  </button>
                ) : null}

                <button type="button" onClick={logout} style={styles.authBtn}>
                  {t[lang].header.logout}
                </button>
              </div>
            )}
          </div>
        </div>

        {!session ? <div style={styles.headerNote}>{t[lang].header.guestCta}</div> : null}
      </header>

      {shopsLoading ? <div style={styles.bannerInfo}>Loading places…</div> : null}
      {shopsError ? <div style={styles.bannerError}>Failed to load places: {shopsError}</div> : null}

      <main
        style={{
          ...styles.main,
          gridTemplateColumns: showSidePane ? "1fr 420px" : "1fr",
        }}
      >
        <section style={styles.mapPane}>
          <div style={styles.mapWrap}>
            <MapView lang={lang} shops={filteredShops} onSelect={(s) => setSelectedShop(s)} />

            <FilterPanel
              lang={lang}
              selected={selectedServices}
              onChange={(next) => {
                setSelectedServices(next);
                if (selectedShop && next.length > 0) {
                  const ok = next.every((k) => Boolean(selectedShop.services?.[k]));
                  if (!ok) setSelectedShop(null);
                }
              }}
              open={filterOpen}
              onToggleOpen={() => setFilterOpen((v) => !v)}
            />
          </div>
        </section>

        {showSidePane ? (
          <aside style={styles.sidePane}>
            <ShopDrawer lang={lang} shop={selectedShop} onClose={() => setSelectedShop(null)} />
          </aside>
        ) : null}
      </main>

      {isNarrow ? (
        <ShopDrawer lang={lang} shop={selectedShop} onClose={() => setSelectedShop(null)} />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 12,
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  },

  header: {
    padding: "18px 20px 16px",
    borderRadius: 24,
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 18px 48px rgba(15,23,42,0.06)",
  },

  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  brandBlock: {
    minWidth: 260,
    flex: "1 1 auto",
  },

  brandEyebrow: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    color: "#2563eb",
    textTransform: "uppercase",
  },

  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 0.2,
    color: "#0f172a",
    lineHeight: 1.15,
  },

  sub: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.5,
    maxWidth: 620,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  headerNote: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
  },

  langBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  langLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  select: {
    border: "1px solid #dbe1ea",
    borderRadius: 14,
    padding: "10px 12px",
    background: "white",
    fontSize: 14,
    fontWeight: 700,
  },

  sessionBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  sessionText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: 800,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "10px 14px",
  },

  primaryBtn: {
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "white",
    borderRadius: 14,
    padding: "10px 14px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,23,42,0.14)",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  authBtn: {
    border: "1px solid #dbe1ea",
    background: "white",
    borderRadius: 14,
    padding: "10px 14px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  bannerInfo: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.9)",
    color: "#64748b",
    fontSize: 12,
  },

  bannerError: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #fee2e2",
    background: "#fff1f2",
    color: "#9f1239",
    fontSize: 12,
  },

  main: {
    marginTop: 14,
    minHeight: "calc(100vh - 145px)",
    display: "grid",
    gap: 12,
  },

  mapPane: {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
    minHeight: 0,
    boxShadow: "0 18px 48px rgba(15,23,42,0.05)",
  },

  mapWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },

  sidePane: {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
    minHeight: 0,
    boxShadow: "0 18px 48px rgba(15,23,42,0.05)",
  },
};