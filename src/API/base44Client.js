import { createClient } from "@base44/sdk";

import { appParams } from "@/lib/app-params";

const BASE44_SERVER_URL = "https://base44.app";

const fallbackEntityClient = {
  list: async () => [],
  filter: async () => [],
  get: async () => null,
  create: async (payload = {}) => payload,
  update: async (_id, payload = {}) => payload,
  delete: async () => ({}),
  bulkCreate: async (payload = []) => payload,
};

const fallbackDb = {
  __isFallback: true,
  auth: {
    isAuthenticated: async () => false,
    me: async () => null,
    logout: () => undefined,
    redirectToLogin: () => undefined,
  },
  entities: new Proxy(
    {},
    {
      get: () => fallbackEntityClient,
    }
  ),
  integrations: {
    Core: {
      UploadFile: async () => ({ file_url: "" }),
      InvokeLLM: async () => ({
        changes: [],
        explanation: "Integracao de IA indisponivel no ambiente local.",
      }),
    },
  },
};

const hasBase44AppId = Boolean(appParams.appId);
const hasRedirectConfig = Boolean(appParams.appBaseUrl);

const configuredDb =
  hasBase44AppId && !globalThis.__B44_DB__
    ? createClient({
        appId: appParams.appId,
        token: appParams.token || undefined,
        appBaseUrl: appParams.appBaseUrl || undefined,
        functionsVersion: appParams.functionsVersion || undefined,
        serverUrl: BASE44_SERVER_URL,
      })
    : null;

export const db = globalThis.__B44_DB__ || configuredDb || fallbackDb;
export const isFallbackDb = db.__isFallback === true;
export const isBase44Configured = hasBase44AppId;
export const canRedirectToLogin = hasRedirectConfig;
export const base44ServerUrl = BASE44_SERVER_URL;
export const base44 = db;

export default db;
