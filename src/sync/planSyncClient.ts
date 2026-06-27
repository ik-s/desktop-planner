import type { LargePlan } from "../model/types";

type TokenStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type PlanSyncClientOptions = {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
  tokenStore?: TokenStore;
};

type AppLocation = Pick<Location, "origin" | "port">;

const TOKEN_KEY = "desktop-planner:sync-token";
const DEFAULT_API_URL = "http://127.0.0.1:8787";
const DEV_SERVER_PORTS = new Set(["5173"]);

const normalizeApiUrl = (apiUrl: string) => apiUrl.replace(/\/+$/, "");

const getDefaultTokenStore = (): TokenStore => localStorage;

export const resolvePlanApiUrl = (
  configuredApiUrl?: string,
  appLocation: AppLocation | undefined = globalThis.location
) => {
  if (appLocation && !DEV_SERVER_PORTS.has(appLocation.port)) return appLocation.origin;
  if (configuredApiUrl) return configuredApiUrl;
  return DEFAULT_API_URL;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLargePlan = (value: unknown): value is LargePlan =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string";

export const createPlanSyncClient = ({
  apiUrl = resolvePlanApiUrl(import.meta.env.VITE_PLANNER_API_URL),
  fetchImpl = fetch,
  tokenStore = getDefaultTokenStore()
}: PlanSyncClientOptions = {}) => {
  const baseUrl = normalizeApiUrl(apiUrl);

  const getToken = () => tokenStore.getItem(TOKEN_KEY);
  const clearToken = () => tokenStore.removeItem(TOKEN_KEY);

  const authenticatedHeaders = () => {
    const token = getToken();
    if (!token) throw new Error("not_authenticated");
    return { authorization: `Bearer ${token}` };
  };

  const failUnauthorized = (response: Response) => {
    if (response.status === 401) {
      clearToken();
      throw new Error("unauthorized");
    }
  };

  return {
    getSession() {
      return { isAuthenticated: Boolean(getToken()) };
    },

    logout() {
      clearToken();
    },

    async login(username: string, password: string) {
      const response = await fetchImpl(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) throw new Error("invalid_credentials");
      const body: unknown = await response.json();
      if (!isRecord(body) || typeof body.token !== "string") throw new Error("invalid_login_response");
      tokenStore.setItem(TOKEN_KEY, body.token);
    },

    async loadPlans() {
      const response = await fetchImpl(`${baseUrl}/api/plans`, {
        headers: authenticatedHeaders()
      });
      failUnauthorized(response);
      if (!response.ok) throw new Error("load_failed");
      const body: unknown = await response.json();
      if (!isRecord(body) || !Array.isArray(body.plans) || !body.plans.every(isLargePlan)) {
        throw new Error("invalid_plans_response");
      }
      return body.plans;
    },

    async savePlans(plans: LargePlan[]) {
      const response = await fetchImpl(`${baseUrl}/api/plans`, {
        method: "PUT",
        headers: { ...authenticatedHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ plans })
      });
      failUnauthorized(response);
      if (!response.ok) throw new Error("save_failed");
    }
  };
};

export type PlanSyncClient = ReturnType<typeof createPlanSyncClient>;
