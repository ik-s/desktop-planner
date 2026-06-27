import { loadLocalEnv } from "./env.mjs";
import { startPlannerServer } from "./plannerServer.mjs";

await loadLocalEnv();
startPlannerServer();
