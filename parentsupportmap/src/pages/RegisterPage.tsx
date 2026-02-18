import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AuthRepo } from "../repos/auth/types";

export default function RegisterPage({
  auth,
  onDone,
}: {
  auth: AuthRepo;
  onDone: () => void;
}) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      auth.register({ email: email.trim(), userId: userId.trim(), password });
      onDone();
      nav("/", { replace: true });
    } catch (ex: any) {
      setErr(ex?.message ?? "Register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={title}>Register</div>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input style={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={input} placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <input style={input} placeholder="Password (>=6)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {err ? <div style={errStyle}>{err}</div> : null}

          <button style={btn} disabled={busy}>
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>

        <div style={foot}>
          Already have an account? <Link to="/login">Login</Link>
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

const title: React.CSSProperties = { fontSize: 18, fontWeight: 900 };

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

const foot: React.CSSProperties = { marginTop: 12, fontSize: 13, color: "#374151" };
