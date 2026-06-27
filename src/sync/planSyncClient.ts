import { createInitialState } from "../model/plannerModel";
import type { DailyPlanEntry, DetailItem, LargePlan, PlannerState, PlannerStatus } from "../model/types";

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

const validStatuses = new Set<PlannerStatus>(["waiting", "in_progress", "done"]);

const isDetailItem = (value: unknown): value is DetailItem =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.order === "number" &&
  typeof value.status === "string" &&
  validStatuses.has(value.status as PlannerStatus) &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string";

const isDailyPlanEntry = (value: unknown): value is DailyPlanEntry =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.date === "string" &&
  typeof value.largePlanId === "string" &&
  typeof value.order === "number" &&
  typeof value.status === "string" &&
  validStatuses.has(value.status as PlannerStatus) &&
  Array.isArray(value.detailItems) &&
  value.detailItems.every(isDetailItem) &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string";

const isPlannerState = (value: unknown): value is PlannerState =>
  isRecord(value) &&
  Array.isArray(value.largePlans) &&
  value.largePlans.every(isLargePlan) &&
  isRecord(value.dailyEntries) &&
  Object.values(value.dailyEntries).every((entries) => Array.isArray(entries) && entries.every(isDailyPlanEntry));

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

    async loadState() {
      const response = await fetchImpl(`${baseUrl}/api/plans`, {
        headers: authenticatedHeaders()
      });
      failUnauthorized(response);
      if (!response.ok) throw new Error("load_failed");
      const body: unknown = await response.json();
      if (!isRecord(body)) {
        throw new Error("invalid_plans_response");
      }
      if (isPlannerState(body.state)) return body.state;
      if (Array.isArray(body.plans) && body.plans.every(isLargePlan)) {
        return { ...createInitialState(), largePlans: body.plans };
      }
      throw new Error("invalid_plans_response");
    },

    async saveState(state: PlannerState) {
      const response = await fetchImpl(`${baseUrl}/api/plans`, {
        method: "PUT",
        headers: { ...authenticatedHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ state })
      });
      failUnauthorized(response);
      if (!response.ok) throw new Error("save_failed");
    },

    async loadPlans() {
      return (await this.loadState()).largePlans;
    },

    async savePlans(plans: LargePlan[]) {
      await this.saveState({ ...createInitialState(), largePlans: plans });
    }
  };
};

export type PlanSyncClient = ReturnType<typeof createPlanSyncClient>;
