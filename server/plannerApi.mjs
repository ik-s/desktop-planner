import { createHash } from "node:crypto";

export const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

export const isLargePlan = (value) =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string";

const validStatuses = new Set(["waiting", "in_progress", "done"]);

const isDetailItem = (value) =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.order === "number" &&
  validStatuses.has(value.status) &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string";

const isDailyPlanEntry = (value) =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.date === "string" &&
  typeof value.largePlanId === "string" &&
  typeof value.order === "number" &&
  validStatuses.has(value.status) &&
  Array.isArray(value.detailItems) &&
  value.detailItems.every(isDetailItem) &&
  typeof value.createdAt === "string" &&
  typeof value.updatedAt === "string";

export const isPlannerState = (value) =>
  isRecord(value) &&
  Array.isArray(value.largePlans) &&
  value.largePlans.every(isLargePlan) &&
  isRecord(value.dailyEntries) &&
  Object.values(value.dailyEntries).every((entries) => Array.isArray(entries) && entries.every(isDailyPlanEntry));

const stateFromPlans = (plans) => ({ largePlans: plans, dailyEntries: {} });

export const makeToken = (username, password) =>
  createHash("sha256").update(`${username}:${password}`).digest("hex");

const setJsonHeaders = (response) => {
  response.setHeader?.("access-control-allow-headers", "authorization, content-type");
  response.setHeader?.("access-control-allow-methods", "GET, POST, PUT, OPTIONS");
  response.setHeader?.("access-control-allow-origin", "*");
};

const sendJson = (response, statusCode, body) => {
  setJsonHeaders(response);
  response.status(statusCode).json(body);
};

const getBody = (request) => {
  if (typeof request.body === "string") return JSON.parse(request.body || "{}");
  if (isRecord(request.body)) return request.body;
  return {};
};

export const createLoginHandler =
  ({ username = process.env.PLANNER_USERNAME ?? "me", password = process.env.PLANNER_PASSWORD ?? "planner" } = {}) =>
  async (request, response) => {
    if (request.method === "OPTIONS") {
      setJsonHeaders(response);
      response.status(204).end();
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    const body = getBody(request);
    if (body.username === username && body.password === password) {
      sendJson(response, 200, { token: makeToken(username, password) });
      return;
    }
    sendJson(response, 401, { error: "invalid_credentials" });
  };

export const createPlansHandler =
  ({
    store,
    username = process.env.PLANNER_USERNAME ?? "me",
    password = process.env.PLANNER_PASSWORD ?? "planner"
  } = {}) =>
  async (request, response) => {
    if (request.method === "OPTIONS") {
      setJsonHeaders(response);
      response.status(204).end();
      return;
    }

    if (request.headers?.authorization !== `Bearer ${makeToken(username, password)}`) {
      sendJson(response, 401, { error: "unauthorized" });
      return;
    }

    if (request.method === "GET") {
      const state = store.loadState ? await store.loadState() : stateFromPlans(await store.loadPlans());
      sendJson(response, 200, { state, plans: state.largePlans });
      return;
    }

    if (request.method === "PUT") {
      const body = getBody(request);
      if (isPlannerState(body.state)) {
        if (store.saveState) {
          await store.saveState(body.state);
        } else {
          await store.savePlans(body.state.largePlans);
        }
        sendJson(response, 200, { state: body.state, plans: body.state.largePlans });
        return;
      }

      if (!Array.isArray(body.plans) || !body.plans.every(isLargePlan)) {
        sendJson(response, 400, { error: "invalid_plans" });
        return;
      }
      const state = stateFromPlans(body.plans);
      if (store.saveState) {
        await store.saveState(state);
      } else {
        await store.savePlans(body.plans);
      }
      sendJson(response, 200, { state, plans: body.plans });
      return;
    }

    sendJson(response, 405, { error: "method_not_allowed" });
  };
