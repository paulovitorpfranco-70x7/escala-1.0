import { createContext, useContext, useEffect, useState } from "react";

import { db, isFallbackDb } from "@/API/base44Client";
import { appParams } from "@/lib/app-params";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    void checkAppState();
  }, []);

  async function checkAppState() {
    setAuthError(null);
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAppPublicSettings(null);

    setIsLoadingPublicSettings(false);

    if (!appParams.token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);

      if (!isFallbackDb) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }

      return;
    }

    try {
      const currentUser = await db.auth.me();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      setIsLoadingAuth(false);

      if (!currentUser && !isFallbackDb) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthError({
        type: "auth_required",
        message: error?.message || "Authentication required",
      });
    }
  }

  function logout(shouldRedirect = true) {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      db.auth.logout?.(window.location.href);
      return;
    }

    db.auth.logout?.();
  }

  function navigateToLogin() {
    db.auth.redirectToLogin?.(window.location.href);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
