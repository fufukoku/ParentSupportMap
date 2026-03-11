import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Shop,
  ServiceKey,
  Services,
  ShopCategory,
} from "../types";
import type { Session } from "../repos/auth/types";
import { SERVICE_META } from "../constants/serviceMeta";
import AdminLocationPicker from "../components/AdminLocationPicker";
import { buildAdminAuthHeaders } from "../repos/auth/getAccessToken";
import {
  SHOP_CATEGORY_META,
  SHOP_CATEGORY_OPTIONS,
  getShopCategoryLabel,
} from "../constants/shopCategoryMeta";

const ALL_SERVICE_KEYS: ServiceKey[] = [
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

const SERVICE_LABEL_JA: Record<ServiceKey, string> = {
  diaper_change: "おむつ交換スペース",
  diaper_trash: "おむつ廃棄（ゴミ箱）",
  kids_toilet: "子ども用トイレ",
  nursing_room: "授乳スペース",
  stroller_access: "ベビーカー入店可",
  kids_chair_tableware: "子ども用椅子・食器",
  parking_car: "駐車場",
  parking_bicycle: "駐輪場",
  hot_water: "お湯（ミルク用）",
};

function emptyServices(): Services {
  return {
    diaper_change: false,
    diaper_trash: false,
    kids_toilet: false,
    nursing_room: false,
    stroller_access: false,
    kids_chair_tableware: false,
    parking_car: false,
    parking_bicycle: false,
    hot_water: false,
  };
}

function normalizeCategory(value: any): ShopCategory {
  return SHOP_CATEGORY_OPTIONS.includes(value as ShopCategory)
    ? (value as ShopCategory)
    : "other";
}

function apiBase(): string {
  return (
    (import.meta as any).env?.VITE_API_BASE ??
    "https://zzvcdp16u5.execute-api.ap-northeast-1.amazonaws.com/dev"
  );
}

function fromApiItem(a: any): Shop {
  const servicesBool = emptyServices();
  const arr: string[] = Array.isArray(a?.services) ? a.services : [];
  for (const k of ALL_SERVICE_KEYS) servicesBool[k] = arr.includes(k);

  return {
    id: String(a.shopId),
    name: a.nameJa || a.nameEn || "Unnamed",
    category: normalizeCategory(a.category),
    lat: Number(a.lat ?? 0),
    lng: Number(a.lng ?? 0),
    address: a.address ?? "",
    photos: Array.isArray(a.imageUrls) ? a.imageUrls : [],
    services: servicesBool,
    note: a.descriptionJa || a.descriptionEn || "",
  };
}

function toApiPayload(s: Shop) {
  const servicesArr = ALL_SERVICE_KEYS.filter((k) => Boolean(s.services?.[k]));
  return {
    shopId: s.id,
    nameJa: s.name,
    nameEn: "",
    category: s.category ?? "other",
    descriptionJa: s.note ?? "",
    descriptionEn: "",
    address: s.address ?? "",
    lat: s.lat,
    lng: s.lng,
    services: servicesArr,
    imageUrls: s.photos ?? [],
    isActive: true,
  };
}

export default function AdminPage({ session }: { session: Session }) {
  const nav = useNavigate();
  const API = useMemo(() => apiBase(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editing, setEditing] = useState<Shop | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!editing) return;

    const timer = window.setTimeout(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [editing]);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/shops`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.items ?? []).map(fromApiItem) as Shop[];
      setItems(mapped);
    } catch (e: any) {
      setErr(e?.message || "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.role !== "admin") {
      nav("/login", { replace: true });
      return;
    }
    refresh();
  }, [nav, session.role]);

  const startAdd = () => {
    setEditing({
      id: "",
      name: "",
      category: "other",
      lat: 35.6762,
      lng: 139.6503,
      address: "",
      photos: [],
      services: emptyServices(),
      note: "",
    });
  };

  const startEdit = (s: Shop) => setEditing({ ...s });

  const del = async (s: Shop) => {
    if (!confirm(`「${s.name}」を削除しますか？`)) return;
    setErr(null);

    try {
      const authHeaders = await buildAdminAuthHeaders();

      const res = await fetch(`${API}/shops/${encodeURIComponent(s.id)}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    }
  };

  const save = async () => {
    if (!editing) return;

    if (!editing.name.trim()) {
      return setErr("施設名を入力してください。");
    }

    if (!Number.isFinite(editing.lat) || !Number.isFinite(editing.lng)) {
      return setErr("緯度・経度が不正です。");
    }

    setSaving(true);
    setErr(null);

    try {
      const authHeaders = await buildAdminAuthHeaders();

      if (!editing.id) {
        const payload = toApiPayload({ ...editing, id: undefined as any });
        const res = await fetch(`${API}/shops`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const payload = toApiPayload(editing);
        const res = await fetch(`${API}/shops/${encodeURIComponent(editing.id)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      setEditing(null);
      await refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleSvc = (k: ServiceKey) => {
    if (!editing) return;
    setEditing({
      ...editing,
      services: {
        ...editing.services,
        [k]: !editing.services[k],
      },
    });
  };

  const uploadImage = async (file: File) => {
    if (!editing) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErr("JPG / PNG / WEBP / GIF のみ対応しています。");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErr("画像サイズは 5MB 以下にしてください。");
      return;
    }

    setUploading(true);
    setErr(null);

    try {
      const authHeaders = await buildAdminAuthHeaders();

      const presignRes = await fetch(`${API}/uploads/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "shops",
        }),
      });

      if (!presignRes.ok) {
        throw new Error(`Presign failed: HTTP ${presignRes.status}`);
      }

      const presignData = await presignRes.json();

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: HTTP ${uploadRes.status}`);
      }

      setEditing((prev: Shop | null) =>
        prev
          ? {
              ...prev,
              photos: [...(prev.photos ?? []), presignData.publicUrl],
            }
          : prev
      );
    } catch (e: any) {
      setErr(e?.message || "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    if (!editing) return;
    const next = [...(editing.photos ?? [])];
    next.splice(index, 1);
    setEditing({ ...editing, photos: next });
  };

  return (
    <div
      style={{
        padding: isNarrow ? 10 : 16,
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>管理画面</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => nav("/")} style={btnGhost}>
            戻る
          </button>
          <button onClick={refresh} style={btnGhost} disabled={loading}>
            再読み込み
          </button>
          <button onClick={startAdd} style={btnPrimary}>
            施設を追加
          </button>
        </div>
      </div>

      {err ? (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #fee2e2",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {err}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          overflow: "hidden",
          background: "white",
          boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #eef0f6",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          施設一覧 ({items.length})
        </div>

        {loading ? <div style={{ padding: 12, color: "#6b7280" }}>Loading…</div> : null}
        {!loading && items.length === 0 ? (
          <div style={{ padding: 12, color: "#6b7280" }}>施設がありません</div>
        ) : null}

        {items.map((s) => {
          const categoryMeta = SHOP_CATEGORY_META[s.category ?? "other"];
          const categoryLabel = getShopCategoryLabel("ja", s.category ?? "other");

          return (
            <div
              key={s.id}
              style={{
                padding: 14,
                borderTop: "1px solid #eef0f6",
                display: "flex",
                alignItems: isNarrow ? "stretch" : "center",
                justifyContent: "space-between",
                gap: 12,
                flexDirection: isNarrow ? "column" : "row",
              }}
            >
              <div style={{ minWidth: 0, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={listThumbWrap}>
                  {s.photos?.[0] ? (
                    <img src={s.photos[0]} alt={s.name} style={listThumb} />
                  ) : (
                    <div style={listThumbEmpty}>📍</div>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
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
                    }}
                  >
                    <span>{categoryMeta.emoji}</span>
                    <span>{categoryLabel}</span>
                  </div>

                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 16,
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.name}
                  </div>

                  {s.address ? (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: "#6b7280",
                        lineHeight: 1.45,
                      }}
                    >
                      {s.address}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flex: "0 0 auto",
                  width: isNarrow ? "100%" : undefined,
                }}
              >
                <button
                  onClick={() => startEdit(s)}
                  style={{
                    ...btnGhost,
                    flex: isNarrow ? 1 : undefined,
                  }}
                >
                  編集
                </button>
                <button
                  onClick={() => del(s)}
                  style={{
                    ...btnDanger,
                    flex: isNarrow ? 1 : undefined,
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing ? (
        <div
          ref={editorRef}
          style={{
            marginTop: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            background: "white",
            padding: isNarrow ? 12 : 16,
            boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 12, fontSize: 17 }}>
            {editing.id ? "施設を編集" : "施設を追加"}
          </div>

          <div
            style={{
              ...grid2,
              gridTemplateColumns: isNarrow
                ? "1fr"
                : "repeat(2, minmax(0, 1fr))",
            }}
          >
            <label style={field}>
              <div style={lab}>施設名</div>
              <input
                style={input}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>

            <label style={field}>
              <div style={lab}>施設タイプ</div>
              <select
                style={input}
                value={editing.category}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    category: normalizeCategory(e.target.value),
                  })
                }
              >
                {SHOP_CATEGORY_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {SHOP_CATEGORY_META[k].emoji} {getShopCategoryLabel("ja", k)}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ ...field, gridColumn: "1 / -1" }}>
              <div style={lab}>住所</div>
              <input
                style={input}
                value={editing.address ?? ""}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </label>

            <label style={field}>
              <div style={lab}>緯度</div>
              <input
                style={input}
                type="number"
                step="0.000001"
                value={String(editing.lat)}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    lat: Number(e.target.value),
                  })
                }
              />
            </label>

            <label style={field}>
              <div style={lab}>経度</div>
              <input
                style={input}
                type="number"
                step="0.000001"
                value={String(editing.lng)}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    lng: Number(e.target.value),
                  })
                }
              />
            </label>

            <div style={{ gridColumn: "1 / -1" }}>
              <AdminLocationPicker
                lat={editing.lat}
                lng={editing.lng}
                address={editing.address ?? ""}
                onPick={({ lat, lng, address }) => {
                  setEditing({
                    ...editing,
                    lat,
                    lng,
                    address: address ?? editing.address,
                  });
                }}
              />
            </div>

            <label style={{ ...field, gridColumn: "1 / -1" }}>
              <div style={lab}>メモ</div>
              <textarea
                style={{ ...input, minHeight: 88, resize: "vertical" }}
                value={editing.note ?? ""}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>画像</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                style={btnPrimary}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "アップロード中..." : "画像を追加"}
              </button>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                JPG / PNG / WEBP / GIF, up to 5MB
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />

            <div style={photoGrid}>
              {(editing.photos ?? []).map((url: string, idx: number) => (
                <div key={`${url}-${idx}`} style={photoCard}>
                  <img src={url} alt={`shop-${idx + 1}`} style={photoImg} />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    style={removePhotoBtn}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, fontWeight: 900 }}>対応サービス</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {ALL_SERVICE_KEYS.map((k) => {
              const active = Boolean(editing.services?.[k]);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleSvc(k)}
                  style={chip(active)}
                >
                  <span style={{ marginRight: 6 }}>{SERVICE_META[k].emoji}</span>
                  {SERVICE_LABEL_JA[k]}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setEditing(null)}
              style={btnGhost}
              disabled={saving || uploading}
            >
              キャンセル
            </button>
            <button onClick={save} style={btnPrimary} disabled={saving || uploading}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const grid2: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const field: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const lab: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 800,
};

const input: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};

const btnGhost: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 800,
};

const btnPrimary: React.CSSProperties = {
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 900,
};

const btnDanger: React.CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 900,
};

const chip = (active: boolean): React.CSSProperties => ({
  border: "1px solid " + (active ? "#bfdbfe" : "#e5e7eb"),
  background: active ? "#eff6ff" : "white",
  color: "#111827",
  borderRadius: 999,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 800,
});

const photoGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 10,
};

const photoCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  overflow: "hidden",
  background: "white",
};

const photoImg: React.CSSProperties = {
  width: "100%",
  height: 120,
  objectFit: "cover",
  display: "block",
};

const removePhotoBtn: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderTop: "1px solid #e5e7eb",
  background: "#fff",
  color: "#b91c1c",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 800,
};

const listThumbWrap: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  flex: "0 0 auto",
};

const listThumb: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const listThumbEmpty: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
