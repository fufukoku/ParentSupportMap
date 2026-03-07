import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { AuthRepo } from "../repos/auth/types";

export default function ConfirmSignUpPage({
  auth,
}: {
  auth: AuthRepo;
}) {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <div style={title}>Verify your email</div>
        <div style={sub}>
          Enter the verification code sent to your email address.
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <input
            style={input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={input}
            placeholder="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {err ? <div style={errStyle}>{err}</div> : null}

          <button style={btn} disabled={busy}>
            {busy ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div style={foot}>
          Already verified? <Link to="/login">Go to login</Link>
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
  background: "#f6f7fb",
  padding: 16,
};

const card: React.CSSProperties = {
  width: "min(420px, 100%)",
  borderRadius: 16,
  border: "1px solid #e7e9f0",
  background: "white",
  padding: 16,
  boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
};

const title: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
};

const sub: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
};

const btn: React.CSSProperties = {
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const errStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontSize: 13,
  background: "#fef2f2",
  border: "1px solid #fee2e2",
  padding: "8px 10px",
  borderRadius: 12,
};

const foot: React.CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  color: "#374151",
};