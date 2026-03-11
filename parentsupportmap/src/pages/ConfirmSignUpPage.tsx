import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { AuthRepo } from "../repos/auth/types";
import type { Lang } from "../i18n";
import { t } from "../i18n";

const LANG_KEY = "psm_lang";

export default function ConfirmSignUpPage({
  auth,
}: {
  auth: AuthRepo;
}) {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" ? "en" : "ja";
  });

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await auth.confirmSignUp({
        email: email.trim(),
        code: code.trim(),
      });
      nav("/login", { replace: true });
    } catch (ex: any) {
      setErr(ex?.message ?? "Confirmation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={topBar}>
          <button type="button" onClick={() => nav("/")} style={ghostBtn}>
            ← {t[lang].auth.backHome}
          </button>

          <div style={langBox}>
            <span style={langLabel}>{t[lang].language}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              style={select}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div style={eyebrow}>PARENTSUPPORTMAP</div>
        <div style={title}>{t[lang].auth.verifyTitle}</div>
        <div style={sub}>{t[lang].auth.verifyIntro}</div>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <label style={field}>
            <div style={label}>{t[lang].auth.email}</div>
            <input
              style={input}
              placeholder={t[lang].auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label style={field}>
            <div style={label}>{t[lang].auth.verifyCode}</div>
            <input
              style={input}
              placeholder={t[lang].auth.verifyCodePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>

          {err ? <div style={errStyle}>{err}</div> : null}

          <button style={btn} disabled={busy}>
            {busy ? t[lang].auth.verifying : t[lang].auth.verify}
          </button>
        </form>

        <div style={foot}>
          <Link to="/login">{t[lang].auth.toLogin}</Link>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  padding: 16,
};

const card: React.CSSProperties = {
  width: "min(520px, 100%)",
  borderRadius: 24,
  border: "1px solid #e7e9f0",
  background: "rgba(255,255,255,0.96)",
  padding: 24,
  boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
};

const topBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const ghostBtn: React.CSSProperties = {
  border: "1px solid #dbe1ea",
  background: "white",
  color: "#0f172a",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 800,
};

const langBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const langLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};

const select: React.CSSProperties = {
  border: "1px solid #dbe1ea",
  borderRadius: 14,
  padding: "10px 12px",
  background: "white",
  fontSize: 14,
  fontWeight: 700,
};

const eyebrow: React.CSSProperties = {
  marginTop: 18,
  fontSize: 12,
  fontWeight: 900,
  color: "#2563eb",
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: "#0f172a",
  marginTop: 8,
};

const sub: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: "#64748b",
  lineHeight: 1.6,
};

const field: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
};

const input: React.CSSProperties = {
  border: "1px solid #dbe1ea",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  outline: "none",
  background: "white",
};

const btn: React.CSSProperties = {
  border: "1px solid #111827",
  background: "#0f172a",
  color: "white",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
};

const errStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontSize: 13,
  background: "#fef2f2",
  border: "1px solid #fecaca",
  padding: "10px 12px",
  borderRadius: 12,
};

const foot: React.CSSProperties = {
  marginTop: 14,
  fontSize: 14,
  color: "#475569",
};
