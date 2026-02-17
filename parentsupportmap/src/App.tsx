import { useMemo, useState } from "react";
import type { Shop } from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";
import MapView from "./components/MapView";
import ShopDrawer from "./components/ShopDrawer";
import shopsRaw from "./data/shops.demo.json";

export default function App() {
  const [lang, setLang] = useState<Lang>("ja");
  const [selected, setSelected] = useState<Shop | null>(null);
  const shops = useMemo(() => shopsRaw as Shop[], []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>{t[lang].appTitle}</div>
          <div style={styles.sub}>{t[lang].demoNotice}</div>
        </div>

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
      </header>

      <main style={styles.main}>
        <section style={styles.mapPane}>
          <MapView shops={shops} onSelect={(s) => setSelected(s)} />
        </section>

        {/* 右侧栏：宽屏显示；窄屏由 Drawer 自己变 bottom sheet */}
        <aside style={styles.sidePane}>
          <ShopDrawer lang={lang} shop={selected} onClose={() => setSelected(null)} />
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
  langBox: { display: "flex", alignItems: "center", gap: 8 },
  langLabel: { fontSize: 12, color: "#6b7280" },
  select: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
  },
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
  sidePane: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e7e9f0",
    background: "white",
    minWidth: 0,
  },
};
