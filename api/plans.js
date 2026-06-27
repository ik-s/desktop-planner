import { createPlansHandler } from "../server/plannerApi.mjs";
import { createRedisPlanStore } from "../server/redisPlanStore.mjs";

export default async function handler(request, response) {
  try {
    const plansHandler = createPlansHandler({ store: createRedisPlanStore() });
    await plansHandler(request, response);
  } catch {
    response.status(500).json({ error: "server_config_missing" });
  }
}
