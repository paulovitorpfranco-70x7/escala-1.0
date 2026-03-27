const isNode = typeof window === "undefined";
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

function toSnakeCase(value) {
  return value.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function getStoredValue(key) {
  if (typeof storage.getItem === "function") {
    return storage.getItem(key);
  }

  return storage.get(key) ?? null;
}

function setStoredValue(key, value) {
  if (typeof storage.setItem === "function") {
    storage.setItem(key, value);
    return;
  }

  storage.set(key, value);
}

function removeStoredValue(key) {
  if (typeof storage.removeItem === "function") {
    storage.removeItem(key);
    return;
  }

  storage.delete(key);
}

function getAppParamValue(
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {}
) {
  if (isNode) {
    return defaultValue;
  }

  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const nextUrl = `${window.location.pathname}${
      urlParams.toString() ? `?${urlParams.toString()}` : ""
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  if (searchParam) {
    setStoredValue(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue) {
    setStoredValue(storageKey, defaultValue);
    return defaultValue;
  }

  return getStoredValue(storageKey);
}

function getAppParams() {
  if (getAppParamValue("clear_access_token") === "true") {
    removeStoredValue("base44_access_token");
    removeStoredValue("token");
  }

  return {
    appId: getAppParamValue("app_id", {
      defaultValue: import.meta.env.VITE_BASE44_APP_ID,
    }),
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    fromUrl: getAppParamValue("from_url", {
      defaultValue: window.location.href,
    }),
    functionsVersion: getAppParamValue("functions_version", {
      defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
    }),
    appBaseUrl: getAppParamValue("app_base_url", {
      defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL,
    }),
  };
}

export const appParams = {
  ...getAppParams(),
};
