// src/App.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Shop, ServiceKey } from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";

import MapView from "./components/MapView";
import ShopDrawer from "./components/ShopDrawer";
import FilterPanel from "./components/FilterPanel";
import shopsRaw from "./data/shops.demo.json";

import type { Session } from "./repos/auth/types";
import { localAuthRepo } from "./repos/auth/localAuthRepo";

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

  const shops = useMemo(() => shopsRaw as Shop[], []);
  const nav = useNavigate();
  const auth = useMemo(() => localAuthRepo(), []);

  // ✅ 过滤逻辑：满足 ALL 被选择的服务
  const filteredShops = useMemo(() => {
    if (selectedServices.length === 0) return shops;
    return shops.filter((s) =>
      selectedServices.every((k) => Boolean(s.services?.[k]))
    );
  }, [shops, selectedServices]);

  const logout = () => {
    auth.logout();
    onSessionChanged();
    // 可选：登出后把 admin drawer 状态清掉
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>{t[lang].appTitle}</div>
          <div style={styles.sub}>{t[lang].demoNotice}</div>
        </div>

        <div style={styles.headerRight}>
          {/* 语言 */}
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

          {/* 登录状态 */}
          {!session ? (
            <button
              type="button"
              onClick={() => nav("/login")}
              style={styles.authBtn}
            >
              Login
            </button>
          ) : (
            <div style={styles.sessionBox}>
              <span style={styles.sessionText}>
                {session.userId} ({session.role})
              </span>

              {session.role === "admin" ? (
                <button
                  type="button"
                  onClick={() => nav("/admin")}
                  style={styles.authBtn}
                >
                  Admin
                </button>
              ) : null}

              <button
                type="button"
                onClick={logout}
                style={{ ...styles.authBtn, opacity: 0.9 }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.mapPane}>
          {/* ✅ 地图容器需要 position: relative，FilterPanel 才能绝对定位在左上角 */}
          <div style={styles.mapWrap}>
            <MapView shops={filteredShops} onSelect={(s) => setSelectedShop(s)} />

            {/* ✅ 恢复筛选按钮 */}
            <FilterPanel
              lang={lang}
              selected={selectedServices}
              onChange={(next) => {
                setSelectedServices(next);
                // 如果当前选中的店已经不满足筛选，关闭 Drawer
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
          <ShopDrawer
            lang={lang}
            shop={selectedShop}
            onClose={() => setSelectedShop(null)}
          />
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

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

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

  // ✅ 关键：让 FilterPanel 的 absolute 相对这个容器定位
  mapWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },

  sidePane: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
  },
};
