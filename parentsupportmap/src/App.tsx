// src/App.tsx
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
import { localAuthRepo } from "./repos/auth/localAuthRepo";

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
  onSessionChanged: () => void;
}) {
  const [lang, setLang] = useState<Lang>("ja");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // ✅ 筛选状态
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceKey[]>([]);

  const API_BASE =
    (import.meta.env.VITE_API_BASE as string | undefined) ??
    "https://zzvcdp16u5.execute-api.ap-northeast-1.amazonaws.com/dev";

  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  // ✅ 响应式：窄屏不做右侧栏
  const [isNarrow, setIsNarrow] = useState(false);
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
          const name = a.nameJa || a.nameEn || "Unnamed";
          return {
            id: a.shopId,
            name,
            lat: Number(a.lat ?? 0),
            lng: Number(a.lng ?? 0),
            address: a.address ?? "",
            photos: Array.isArray(a.imageUrls) ? a.imageUrls : [],
            services: servicesFromArray(a.services),
            note: a.descriptionJa || a.descriptionEn || "",
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
  }, [API_BASE]);

  const nav = useNavigate();
  const auth = useMemo(() => localAuthRepo(), []);

  const filteredShops = useMemo(() => {
    if (selectedServices.length === 0) return shops;
    return shops.filter((s) => selectedServices.every((k) => Boolean(s.services?.[k])));
  }, [shops, selectedServices]);

  const logout = () => {
    auth.logout();
    onSessionChanged();
  };

  // ✅ 关键：只有「桌面 + 选中店铺」才显示右侧栏，避免巨大空白
  const showSidePane = !isNarrow && !!selectedShop;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ minWidth: 260, flex: "1 1 auto" }}>
          <div style={styles.title}>{t[lang].appTitle}</div>
          <div style={styles.sub}>
            {t[lang].demoNotice}
            <span style={styles.apiText}>
              API:&nbsp;
              <a href={API_BASE} target="_blank" rel="noreferrer" style={styles.apiLink}>
                {API_BASE}
              </a>
            </span>
          </div>
        </div>

        <div style={styles.headerRight}>
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
            <button type="button" onClick={() => nav("/login")} style={styles.authBtn}>
              Login
            </button>
          ) : (
            <div style={styles.sessionBox}>
              <span style={styles.sessionText}>
                {session.userId} ({session.role})
              </span>

              {session.role === "admin" ? (
                <button type="button" onClick={() => nav("/admin")} style={styles.authBtn}>
                  Admin
                </button>
              ) : null}

              <button type="button" onClick={logout} style={styles.authBtn}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {shopsLoading ? <div style={styles.bannerInfo}>Loading shops…</div> : null}
      {shopsError ? <div style={styles.bannerError}>Failed to load shops: {shopsError}</div> : null}

      <main
        style={{
          ...styles.main,
          gridTemplateColumns: showSidePane ? "1fr 420px" : "1fr",
        }}
      >
        <section style={styles.mapPane}>
          <div style={styles.mapWrap}>
            <MapView shops={filteredShops} onSelect={(s) => setSelectedShop(s)} />

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

        {/* ✅ 只有需要时才渲染右侧栏 */}
        {showSidePane ? (
          <aside style={styles.sidePane}>
            <ShopDrawer lang={lang} shop={selectedShop} onClose={() => setSelectedShop(null)} />
          </aside>
        ) : null}
      </main>

      {/* ✅ 窄屏：用 ShopDrawer 自己的 bottom sheet（不占右侧栏） */}
      {isNarrow ? (
        <ShopDrawer lang={lang} shop={selectedShop} onClose={() => setSelectedShop(null)} />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    padding: 12,
    boxSizing: "border-box",
    background: "#f6f7fb",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(6px)",
    flexWrap: "wrap",
  },
  title: { fontSize: 18, fontWeight: 900, letterSpacing: 0.2 },
  sub: { fontSize: 12, color: "#6b7280", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" },
  apiText: { color: "#9ca3af" },
  apiLink: { color: "#2563eb", textDecoration: "none", wordBreak: "break-all" },

  headerRight: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  langBox: { display: "flex", alignItems: "center", gap: 8 },
  langLabel: { fontSize: 12, color: "#6b7280" },
  select: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
  },

  authBtn: {
    border: "1px solid #e7e9f0",
    background: "white",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  sessionBox: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  sessionText: { fontSize: 12, color: "#374151", fontWeight: 800 },

  bannerInfo: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.9)",
    color: "#6b7280",
    fontSize: 12,
  },
  bannerError: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #fee2e2",
    background: "#fff1f2",
    color: "#9f1239",
    fontSize: 12,
  },

  main: {
    marginTop: 12,
    height: "calc(100% - 86px)",
    display: "grid",
    gap: 12,
    minHeight: 0,
  },

  mapPane: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
    minHeight: 0,
  },

  mapWrap: { position: "relative", width: "100%", height: "100%" },

  sidePane: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
    minHeight: 0,
  },
};