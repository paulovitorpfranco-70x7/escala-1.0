import { createContext, useContext, useEffect, useState } from "react";

import {
  base44ServerUrl,
  canRedirectToLogin,
  db,
  isBase44Configured,
  isFallbackDb,
} from "@/API/base44Client";
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

  async function loadPublicSettings() {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-App-Id": String(appParams.appId),
    };

    if (appParams.token) {
      headers.Authorization = `Bearer ${appParams.token}`;
    }

    const response = await fetch(
      `${base44ServerUrl}/api/apps/public/prod/public-settings/by-id/${appParams.appId}`,
      { headers }
    );

    if (!response.ok) {
      let errorData = null;

      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }

      throw {
        message: errorData?.message || "Failed to load app public settings",
        status: response.status,
        data: errorData,
      };
    }

    return response.json();
  }

  function mapAuthError(error) {
    const reason =
      error?.data?.extra_data?.reason ||
      error?.data?.reason ||
      error?.reason ||
      null;

    if (reason === "user_not_registered") {
      return {
        type: "user_not_registered",
        message: "User not registered for this app",
      };
    }

    if (reason === "auth_required" || error?.status === 401 || error?.status === 403) {
      return {
        type: "auth_required",
        message: error?.message || "Authentication required",
      };
    }

    return {
      type: "unknown",
      message: error?.message || "Unable to load authentication state",
    };
  }

  async function checkAppState() {
    setAuthError(null);
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAppPublicSettings(null);

    if (!isBase44Configured || isFallbackDb) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const publicSettings = await loadPublicSettings();
      setAppPublicSettings(publicSettings);
      setIsLoadingPublicSettings(false);
    } catch (error) {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthError(mapAuthError(error));
      return;
    }

    if (!appParams.token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const currentUser = await db.auth.me();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      setIsLoadingAuth(false);

      if (!currentUser) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthError(mapAuthError(error));
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
    if (!canRedirectToLogin) {
      return;
    }

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
