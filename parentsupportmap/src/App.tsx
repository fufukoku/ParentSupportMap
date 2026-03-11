import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

import type {
  Shop,
  ServiceKey,
  Services,
  ShopCategory,
} from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";

import MapView from "./components/MapView";
import ShopDrawer from "./components/ShopDrawer";
import FilterPanel from "./components/FilterPanel";

import type { Session } from "./repos/auth/types";
import { cognitoAuthRepo } from "./repos/auth/cognitoAuthRepo";
import {
  SHOP_CATEGORY_OPTIONS,
  SHOP_CATEGORY_META,
  getShopCategoryLabel,
} from "./constants/shopCategoryMeta";

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

function normalizeCategory(value: any): ShopCategory {
  return SHOP_CATEGORY_OPTIONS.includes(value as ShopCategory)
    ? (value as ShopCategory)
    : "other";
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
  const [searchText, setSearchText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ShopCategory[]>([]);

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
          const name =
            lang === "ja"
              ? a.nameJa || a.nameEn || "Unnamed"
              : a.nameEn || a.nameJa || "Unnamed";

          const note =
            lang === "ja"
              ? a.descriptionJa || a.descriptionEn || ""
              : a.descriptionEn || a.descriptionJa || "";

          return {
            id: a.shopId,
            name,
            category: normalizeCategory(a.category),
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

  const toggleCategory = (category: ShopCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearAllFilters = () => {
    setSearchText("");
    setSelectedCategories([]);
    setSelectedServices([]);
    setSelectedShop(null);
  };

  const filteredShops = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return shops.filter((s) => {
      const serviceOk =
        selectedServices.length === 0 ||
        selectedServices.every((k) => Boolean(s.services?.[k]));

      const categoryOk =
        selectedCategories.length === 0 ||
        selectedCategories.includes(s.category ?? "other");

      const categoryLabel = getShopCategoryLabel(lang, s.category ?? "other").toLowerCase();

      const searchOk =
        !keyword ||
        s.name.toLowerCase().includes(keyword) ||
        (s.address ?? "").toLowerCase().includes(keyword) ||
        (s.note ?? "").toLowerCase().includes(keyword) ||
        categoryLabel.includes(keyword);

      return serviceOk && categoryOk && searchOk;
    });
  }, [shops, selectedServices, selectedCategories, searchText, lang]);

  useEffect(() => {
    if (!selectedShop) return;
    const visible = filteredShops.some((s) => s.id === selectedShop.id);
    if (!visible) setSelectedShop(null);
  }, [filteredShops, selectedShop]);

  const logout = async () => {
    await auth.logout();
    await onSessionChanged();
  };

  const showSidePane = !isNarrow && !!selectedShop;

  const activeFilterCount =
    selectedServices.length + selectedCategories.length + (searchText.trim() ? 1 : 0);

  return (
    <div
      style={{
        ...styles.page,
        padding: isNarrow ? 8 : 12,
      }}
    >
      <header
        style={{
          ...styles.header,
          borderRadius: isNarrow ? 18 : 22,
          padding: isNarrow ? "10px 10px 10px" : "14px 16px 12px",
        }}
      >
        <div
          style={{
            ...styles.headerTop,
            gap: isNarrow ? 10 : 12,
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div style={styles.brandEyebrow}>PARENTSUPPORTMAP</div>
            <div
              style={{
                ...styles.title,
                fontSize: isNarrow ? 18 : 22,
                marginTop: 4,
              }}
            >
              {t[lang].appTitle}
            </div>
            <div
              style={{
                ...styles.sub,
                fontSize: isNarrow ? 12 : 13,
                marginTop: 4,
              }}
            >
              {t[lang].appSubtitle}
            </div>
          </div>

          <div
            style={{
              ...styles.headerActions,
              width: isNarrow ? "100%" : undefined,
              justifyContent: isNarrow ? "space-between" : "flex-end",
            }}
          >
            <div style={styles.langBox}>
              <span style={styles.langLabel}>{t[lang].language}</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                style={{
                  ...styles.select,
                  padding: isNarrow ? "8px 10px" : "9px 12px",
                }}
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
              <div
                style={{
                  ...styles.sessionBox,
                  width: isNarrow ? "100%" : undefined,
                  justifyContent: isNarrow ? "space-between" : "flex-end",
                }}
              >
                <span
                  style={{
                    ...styles.sessionText,
                    maxWidth: isNarrow ? 170 : 260,
                  }}
                  title={session.email}
                >
                  {session.email}
                </span>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {session.role === "admin" ? (
                    <button type="button" onClick={() => nav("/admin")} style={styles.authBtn}>
                      {lang === "ja" ? "管理" : "Admin"}
                    </button>
                  ) : null}

                  <button type="button" onClick={logout} style={styles.authBtn}>
                    {t[lang].header.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            ...styles.toolbar,
            marginTop: isNarrow ? 10 : 12,
            gap: isNarrow ? 8 : 10,
          }}
        >
          <div
            style={{
              ...styles.searchWrap,
              minWidth: isNarrow ? 0 : 260,
              flex: isNarrow ? "1 1 100%" : "1 1 320px",
            }}
          >
            <span style={styles.searchIcon}>⌕</span>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={
                lang === "ja"
                  ? "施設名・住所・タイプで検索"
                  : "Search by name, address, or type"
              }
              style={styles.searchInput}
            />
          </div>

          <div style={styles.resultPill}>
            {lang === "ja" ? `${filteredShops.length}件表示中` : `${filteredShops.length} results`}
          </div>

          {activeFilterCount > 0 ? (
            <button type="button" onClick={clearAllFilters} style={styles.clearBtn}>
              {lang === "ja" ? "クリア" : "Clear"}
            </button>
          ) : null}
        </div>

        <div
          style={{
            ...styles.categoryRow,
            marginTop: 10,
          }}
        >
          {SHOP_CATEGORY_OPTIONS.map((category) => {
            const active = selectedCategories.includes(category);
            const meta = SHOP_CATEGORY_META[category];
            const label = getShopCategoryLabel(lang, category);

            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                style={categoryChip(active)}
              >
                <span>{meta.emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {shopsLoading ? <div style={styles.bannerInfo}>Loading places…</div> : null}
      {shopsError ? (
        <div style={styles.bannerError}>Failed to load places: {shopsError}</div>
      ) : null}

      <main
        style={{
          ...styles.main,
          marginTop: isNarrow ? 10 : 12,
          minHeight: isNarrow ? "calc(100vh - 144px)" : "calc(100vh - 170px)",
          gridTemplateColumns: showSidePane ? "1fr 420px" : "1fr",
        }}
      >
        <section
          style={{
            ...styles.mapPane,
            borderRadius: isNarrow ? 18 : 22,
          }}
        >
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
          <aside
            style={{
              ...styles.sidePane,
              borderRadius: isNarrow ? 18 : 22,
            }}
          >
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

const categoryChip = (active: boolean): React.CSSProperties => ({
  border: "1px solid " + (active ? "#bfdbfe" : "#e2e8f0"),
  background: active ? "#eff6ff" : "white",
  color: active ? "#1d4ed8" : "#334155",
  borderRadius: 999,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
  flex: "0 0 auto",
});

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  },

  header: {
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },

  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  brandEyebrow: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: "#2563eb",
    textTransform: "uppercase",
  },

  title: {
    fontWeight: 900,
    lineHeight: 1.2,
    color: "#0f172a",
  },

  sub: {
    color: "#64748b",
    lineHeight: 1.45,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
    background: "white",
    fontSize: 14,
    fontWeight: 700,
  },

  sessionBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  sessionText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: 800,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "9px 12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  primaryBtn: {
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "white",
    borderRadius: 14,
    padding: "9px 12px",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  authBtn: {
    border: "1px solid #dbe1ea",
    background: "white",
    borderRadius: 14,
    padding: "9px 12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  },

  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  searchIcon: {
    position: "absolute",
    left: 12,
    fontSize: 15,
    color: "#94a3b8",
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    border: "1px solid #dbe1ea",
    borderRadius: 14,
    padding: "10px 12px 10px 34px",
    background: "white",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  resultPill: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#334155",
    borderRadius: 999,
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  clearBtn: {
    border: "1px solid #dbe1ea",
    background: "white",
    color: "#334155",
    borderRadius: 14,
    padding: "9px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  categoryRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 2,
  },

  bannerInfo: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e7e9f0",
    background: "rgba(255,255,255,0.92)",
    color: "#64748b",
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
    display: "grid",
    gap: 12,
  },

  mapPane: {
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
    minHeight: 0,
    boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
  },

  mapWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },

  sidePane: {
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
    minHeight: 0,
    boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
  },
};
