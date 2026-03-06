// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setShopsLoading(true);
      setShopsError(null);
      try {
        const res = await fetch(`${API_BASE}/shops`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json(); // { items: [...] }

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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>{t[lang].appTitle}</div>
          <div style={styles.sub}>
            {t[lang].demoNotice}
            <span style={{ marginLeft: 10, color: "#9ca3af" }}>API: {API_BASE}</span>
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

              <button type="button" onClick={logout} style={{ ...styles.authBtn, opacity: 0.9 }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {shopsLoading ? (
          <div style={{ padding: 8, color: "#6b7280", fontSize: 12 }}>Loading shops…</div>
        ) : null}
        {shopsError ? (
          <div style={{ padding: 8, color: "#b91c1c", fontSize: 12 }}>
            Failed to load shops: {shopsError}
          </div>
        ) : null}

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

        <aside style={styles.sidePane}>
          <ShopDrawer lang={lang} shop={selectedShop} onClose={() => setSelectedShop(null)} />
        </aside>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    padding: 16,
    boxSizing: "border-box",
    background: "#f6f7fb",
  },
  header: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(6px)",
  },
  title: { fontSize: 18, fontWeight: 900, letterSpacing: 0.2 },
  sub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  headerRight: { display: "flex", alignItems: "center", gap: 10 },
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
    fontWeight: 700,
  },
  sessionBox: { display: "flex", alignItems: "center", gap: 8 },
  sessionText: { fontSize: 12, color: "#374151", fontWeight: 700 },

  main: {
    marginTop: 12,
    height: "calc(100% - 68px)",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 12,
  },

  mapPane: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
  },

  mapWrap: { position: "relative", width: "100%", height: "100%" },

  sidePane: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
  },
};