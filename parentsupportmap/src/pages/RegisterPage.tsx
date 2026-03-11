import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AuthRepo } from "../repos/auth/types";
import type { Lang } from "../i18n";
import { t } from "../i18n";

const LANG_KEY = "psm_lang";

function getPasswordChecks(lang: Lang, password: string) {
  return [
    { key: "len", label: t[lang].auth.pwRuleLen, ok: password.length >= 8 },
    { key: "upper", label: t[lang].auth.pwRuleUpper, ok: /[A-Z]/.test(password) },
    { key: "lower", label: t[lang].auth.pwRuleLower, ok: /[a-z]/.test(password) },
    { key: "num", label: t[lang].auth.pwRuleNum, ok: /[0-9]/.test(password) },
    { key: "special", label: t[lang].auth.pwRuleSpecial, ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

function validatePassword(lang: Lang, password: string): string | null {
  const checks = getPasswordChecks(lang, password);
  const failed = checks.find((c) => !c.ok);
  return failed ? failed.label : null;
}

export default function RegisterPage({
  auth,
}: {
  auth: AuthRepo;
}) {
  const nav = useNavigate();

  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" ? "en" : "ja";
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const checks = useMemo(() => getPasswordChecks(lang, password), [lang, password]);
  const passedCount = checks.filter((c) => c.ok).length;

  const strengthLabel =
    passedCount <= 2
      ? t[lang].auth.strengthWeak
      : passedCount <= 4
      ? t[lang].auth.strengthMedium
      : t[lang].auth.strengthStrong;

  const strengthWidth =
    passedCount <= 2 ? "33%" : passedCount <= 4 ? "66%" : "100%";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const pwErr = validatePassword(lang, password);
    if (pwErr) {
      setErr(`${t[lang].auth.passwordRequirementNotMet} ${pwErr}`);
      return;
    }

    setBusy(true);
    try {
      const res = await auth.register({
        email: email.trim(),
        password,
      });
      nav(`/confirm-signup?email=${encodeURIComponent(res.email)}`, { replace: true });
    } catch (ex: any) {
      setErr(ex?.message ?? "Register failed");
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
        <div style={title}>{t[lang].auth.registerTitle}</div>
        <div style={sub}>{t[lang].auth.createIntro}</div>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <label style={field}>
            <div style={label}>{t[lang].auth.email}</div>
            <input
              style={input}
              placeholder={t[lang].auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label style={field}>
            <div style={label}>{t[lang].auth.password}</div>
            <input
              style={input}
              placeholder={t[lang].auth.passwordPlaceholder}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <div style={hintCard}>
            <div style={hintHead}>
              <div style={hintTitle}>{t[lang].auth.passwordRequirements}</div>
              <div style={strengthBadge}>{strengthLabel}</div>
            </div>

            <div style={strengthTrack}>
              <div style={{ ...strengthBar, width: strengthWidth }} />
            </div>

            <div style={checkList}>
              {checks.map((item) => (
                <div key={item.key} style={checkRow}>
                  <span style={checkIcon(item.ok)}>{item.ok ? "✓" : "•"}</span>
                  <span style={checkText(item.ok)}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {err ? <div style={errStyle}>{err}</div> : null}

          <button style={btn} disabled={busy}>
            {busy ? t[lang].auth.creating : t[lang].auth.createAccount}
          </button>
        </form>

        <div style={foot}>
          {t[lang].auth.alreadyAccount} <Link to="/login">{t[lang].auth.loginTitle}</Link>
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
  width: "min(560px, 100%)",
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

const hintCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 14,
};

const hintHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const hintTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
};

const strengthBadge: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#2563eb",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "4px 8px",
};

const strengthTrack: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  height: 8,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
};

const strengthBar: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
  transition: "width 160ms ease",
};

const checkList: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const checkRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const checkIcon = (ok: boolean): React.CSSProperties => ({
  width: 18,
  textAlign: "center",
  color: ok ? "#2563eb" : "#9ca3af",
  fontWeight: 900,
  flex: "0 0 auto",
});

const checkText = (ok: boolean): React.CSSProperties => ({
  fontSize: 13,
  color: ok ? "#2563eb" : "#475569",
  fontWeight: ok ? 700 : 500,
});

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
