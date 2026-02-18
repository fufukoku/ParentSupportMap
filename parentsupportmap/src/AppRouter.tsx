// src/AppRouter.tsx
import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import type { Session } from "./repos/auth/types";
import { localAuthRepo } from "./repos/auth/localAuthRepo";

export default function AppRouter() {
  const auth = useMemo(() => localAuthRepo(), []);
  const [session, setSession] = useState<Session | null>(() => auth.getSession());

  const refreshSession = () => setSession(auth.getSession());

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<App session={session} onSessionChanged={refreshSession} />}
        />

        <Route
          path="/login"
          element={<LoginPage auth={auth} onLoggedIn={refreshSession} />}
        />

        <Route
          path="/register"
          element={<RegisterPage auth={auth} onDone={refreshSession} />}
        />

        <Route
          path="/admin"
          element={
            session?.role === "admin" ? (
              <div style={{ padding: 24 }}>Admin console (TODO)</div>
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
