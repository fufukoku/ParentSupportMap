import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ConfirmSignUpPage from "./pages/ConfirmSignUpPage";
import AdminPage from "./pages/AdminPage";

import type { Session } from "./repos/auth/types";
import { cognitoAuthRepo } from "./repos/auth/cognitoAuthRepo";

export default function AppRouter() {
  const auth = useMemo(() => cognitoAuthRepo(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const refreshSession = async () => {
    const next = await auth.getSession();
    setSession(next);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const next = await auth.getSession();
      if (mounted) {
        setSession(next);
        setLoadingSession(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth]);

  if (loadingSession) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App session={session} onSessionChanged={refreshSession} />} />
        <Route path="/login" element={<LoginPage auth={auth} onLoggedIn={refreshSession} />} />
        <Route path="/register" element={<RegisterPage auth={auth} />} />
        <Route path="/confirm-signup" element={<ConfirmSignUpPage auth={auth} />} />

        <Route
          path="/admin"
          element={
            session?.role === "admin" ? (
              <AdminPage session={session} />
            ) : session ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}