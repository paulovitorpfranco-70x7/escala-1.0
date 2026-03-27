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

export const db = globalThis.__B44_DB__ || fallbackDb;
export const isFallbackDb = db.__isFallback === true;
export const base44 = db;

export default db;
