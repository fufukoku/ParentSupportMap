import type { CSSProperties } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { ServiceKey } from "../types";

type Props = {
  lang: Lang;
  selected: ServiceKey[];
  onChange: (next: ServiceKey[]) => void;
  open: boolean;
  onToggleOpen: () => void;
};

export default function FilterPanel({
  lang,
  selected,
  onChange,
  open,
  onToggleOpen,
}: Props) {
  const allKeys = Object.keys(t[lang].services).filter(
    (k) => k !== "notAvailableTitle"
  ) as ServiceKey[];

  const set = new Set(selected);

  const toggle = (k: ServiceKey) => {
    const next = new Set(set);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onChange(Array.from(next));
  };

  const clear = () => onChange([]);

  return (
    <div style={root}>
      {/* ✅ 漏斗按钮（地图左上角） */}
      <button
        type="button"
        onClick={onToggleOpen}
        style={fab(selected.length > 0)}
        aria-label={lang === "ja" ? "絞り込み" : "Filter"}
        title={lang === "ja" ? "絞り込み" : "Filter"}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>⛃</span>
        {selected.length > 0 ? <span style={badge}>{selected.length}</span> : null}
      </button>

      {/* ✅ 面板 */}
      {open ? (
        <div style={panel}>
          <div style={head}>
            <div style={title}>{lang === "ja" ? "絞り込み" : "Filter"}</div>

            <div style={{ display: "flex", gap: 8 }}>
              {selected.length > 0 ? (
                <button type="button" onClick={clear} style={btnGhost}>
                  {lang === "ja" ? "クリア" : "Clear"}
                </button>
              ) : null}
              <button type="button" onClick={onToggleOpen} style={btnGhost}>
                {lang === "ja" ? "閉じる" : "Close"}
              </button>
            </div>
          </div>

          <div style={chips}>
            {allKeys.map((k) => {
              const active = set.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  style={chip(active)}
                  aria-pressed={active}
                  title={t[lang].services[k]}
                >
                  <span style={dot(active)} />
                  <span style={chipText}>{t[lang].services[k]}</span>
                </button>
              );
            })}
          </div>

          <div style={hint}>
            {lang === "ja"
              ? "選択したサービスをすべて満たす施設のみ表示します。"
              : "Shows places that satisfy ALL selected services."}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const root: CSSProperties = {
  position: "absolute",
  left: 12,
  top: 12,
  zIndex: 6,
};

const fab = (active: boolean): CSSProperties => ({
  position: "relative",
  border: "1px solid " + (active ? "#bfdbfe" : "#e7e9f0"),
  background: active ? "#eff6ff" : "rgba(255,255,255,0.92)",
  backdropFilter: "blur(6px)",
  borderRadius: 14,
  width: 44,
  height: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
});

const badge: CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  padding: "0 6px",
  borderRadius: 999,
  background: "#2563eb",
  color: "white",
  fontSize: 11,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid white",
};

const panel: CSSProperties = {
  marginTop: 10,
  width: 360,
  maxWidth: "calc(100vw - 24px)",
  border: "1px solid #e7e9f0",
  borderRadius: 16,
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(6px)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
  padding: 12,
};

const head: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
};

const title: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
};

const btnGhost: CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: 12,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
};

const chips: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chip = (active: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 999,
  border: "1px solid " + (active ? "#bfdbfe" : "#e5e7eb"),
  background: active ? "#eff6ff" : "white",
  padding: "8px 10px",
  cursor: "pointer",
  maxWidth: "100%",
});

const dot = (active: boolean): CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: 999,
  background: active ? "#2563eb" : "#d1d5db",
  flex: "0 0 auto",
});

const chipText: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const hint: CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.4,
};
