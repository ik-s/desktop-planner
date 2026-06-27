import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

const DEFAULT_DATA_FILE = join(process.cwd(), "server", "data", "planner.json");
const DEFAULT_STATIC_DIR = join(process.cwd(), "dist");

const jsonHeaders = {
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
  "access-control-allow-origin": "*",
  "content-type": "application/json; charset=utf-8"
};

const staticContentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"]
]);

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

const isLargePlan = (value) =>
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

const isPlannerState = (value) =>
  isRecord(value) &&
  Array.isArray(value.largePlans) &&
  value.largePlans.every(isLargePlan) &&
  isRecord(value.dailyEntries) &&
  Object.values(value.dailyEntries).every((entries) => Array.isArray(entries) && entries.every(isDailyPlanEntry));

const createEmptyState = () => ({ largePlans: [], dailyEntries: {} });

const stateFromPlans = (plans) => ({ largePlans: plans, dailyEntries: {} });

const readJsonBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, jsonHeaders);
  response.end(JSON.stringify(body));
};

const sendFile = (response, content, filePath) => {
  response.writeHead(200, {
    "content-type": staticContentTypes.get(extname(filePath)) ?? "application/octet-stream"
  });
  response.end(content);
};

const resolvePublicPath = (staticDir, pathname) => {
  const root = resolve(staticDir);
  const requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = resolve(root, requestedPath);
  const relativePath = relative(root, filePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) return undefined;
  return filePath;
};

const tryServeStatic = async (request, response, staticDir) => {
  if (!staticDir || !["GET", "HEAD"].includes(request.method)) return false;

  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (url.pathname.startsWith("/api/")) return false;

  const filePath = resolvePublicPath(staticDir, url.pathname);
  if (!filePath) {
    sendJson(response, 404, { error: "not_found" });
    return true;
  }

  try {
    const content = await readFile(filePath);
    if (request.method === "HEAD") {
      response.writeHead(200, {
        "content-type": staticContentTypes.get(extname(filePath)) ?? "application/octet-stream"
      });
      response.end();
      return true;
    }
    sendFile(response, content, filePath);
    return true;
  } catch (error) {
    if (error?.code !== "ENOENT" || extname(url.pathname)) return false;
    const indexPath = resolvePublicPath(staticDir, "/");
    if (!indexPath) return false;
    try {
      const content = await readFile(indexPath);
      sendFile(response, content, indexPath);
      return true;
    } catch {
      return false;
    }
  }
};

const loadState = async (dataFile) => {
  try {
    const parsed = JSON.parse(await readFile(dataFile, "utf8"));
    if (isPlannerState(parsed.state)) return parsed.state;
    if (Array.isArray(parsed.plans) && parsed.plans.every(isLargePlan)) return stateFromPlans(parsed.plans);
    return createEmptyState();
  } catch (error) {
    if (error?.code === "ENOENT") return createEmptyState();
    throw error;
  }
};

const saveState = async (dataFile, state) => {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify({ state }, null, 2)}\n`, "utf8");
};

const makeToken = (username, password) =>
  createHash("sha256").update(`${username}:${password}`).digest("hex");

export const createPlannerServer = ({
  dataFile = DEFAULT_DATA_FILE,
  staticDir = DEFAULT_STATIC_DIR,
  username = process.env.PLANNER_USERNAME ?? "me",
  password = process.env.PLANNER_PASSWORD ?? "planner"
} = {}) => {
  const token = makeToken(username, password);

  const isAuthenticated = (request) => request.headers.authorization === `Bearer ${token}`;

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");

      if (request.method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/login") {
        const body = await readJsonBody(request);
        if (body.username === username && body.password === password) {
          sendJson(response, 200, { token });
          return;
        }
        sendJson(response, 401, { error: "invalid_credentials" });
        return;
      }

      if (url.pathname === "/api/plans") {
        if (!isAuthenticated(request)) {
          sendJson(response, 401, { error: "unauthorized" });
          return;
        }

        if (request.method === "GET") {
          const state = await loadState(dataFile);
          sendJson(response, 200, { state, plans: state.largePlans });
          return;
        }

        if (request.method === "PUT") {
          const body = await readJsonBody(request);
          if (isPlannerState(body.state)) {
            await saveState(dataFile, body.state);
            sendJson(response, 200, { state: body.state, plans: body.state.largePlans });
            return;
          }

          if (!Array.isArray(body.plans) || !body.plans.every(isLargePlan)) {
            sendJson(response, 400, { error: "invalid_plans" });
            return;
          }
          const state = stateFromPlans(body.plans);
          await saveState(dataFile, state);
          sendJson(response, 200, { state, plans: body.plans });
          return;
        }
      }

      if (await tryServeStatic(request, response, staticDir)) return;

      sendJson(response, 404, { error: "not_found" });
    } catch {
      sendJson(response, 500, { error: "server_error" });
    }
  });
};

export const startPlannerServer = ({
  host = process.env.PLANNER_HOST ?? "127.0.0.1",
  port = Number(process.env.PLANNER_PORT ?? 8787),
  dataFile = process.env.PLANNER_DATA_FILE ?? DEFAULT_DATA_FILE,
  staticDir = process.env.PLANNER_STATIC_DIR ?? DEFAULT_STATIC_DIR,
  username = process.env.PLANNER_USERNAME ?? "me",
  password = process.env.PLANNER_PASSWORD ?? "planner"
} = {}) => {
  const server = createPlannerServer({ dataFile, staticDir, username, password });
  server.listen(port, host, () => {
    console.log(`Planner API listening on http://${host}:${port}`);
  });
  return server;
};
