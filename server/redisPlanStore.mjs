import { isLargePlan, isPlannerState, isRecord } from "./plannerApi.mjs";

const DEFAULT_REDIS_KEY = "desktop-planner:large-plans";

const normalizeRedisUrl = (redisUrl) => redisUrl.replace(/\/+$/, "");

export const createRedisPlanStore = ({
  redisUrl = process.env.UPSTASH_REDIS_REST_URL,
  redisToken = process.env.UPSTASH_REDIS_REST_TOKEN,
  key = process.env.PLANNER_REDIS_KEY ?? DEFAULT_REDIS_KEY,
  fetchImpl = fetch
} = {}) => {
  if (!redisUrl || !redisToken) throw new Error("missing_upstash_config");
  const url = normalizeRedisUrl(redisUrl);

  const command = async (args) => {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { authorization: `Bearer ${redisToken}`, "content-type": "application/json" },
      body: JSON.stringify(args)
    });
    const body = await response.json();
    if (!response.ok || body?.error) throw new Error("redis_command_failed");
    return body?.result;
  };

  return {
    async loadState() {
      const result = await command(["GET", key]);
      if (!result) return { largePlans: [], dailyEntries: {} };
      const parsed = JSON.parse(result);
      if (isRecord(parsed) && isPlannerState(parsed.state)) {
        return parsed.state;
      }
      if (isRecord(parsed) && Array.isArray(parsed.plans) && parsed.plans.every(isLargePlan)) {
        return { largePlans: parsed.plans, dailyEntries: {} };
      }
      return { largePlans: [], dailyEntries: {} };
    },

    async saveState(state) {
      await command(["SET", key, JSON.stringify({ state })]);
    },

    async loadPlans() {
      return (await this.loadState()).largePlans;
    },

    async savePlans(plans) {
      await this.saveState({ largePlans: plans, dailyEntries: {} });
    }
  };
};
