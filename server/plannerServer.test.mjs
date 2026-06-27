import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createPlannerServer } from "./plannerServer.mjs";

const servers = [];
const tempDirs = [];

const startServer = async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "desktop-planner-"));
  tempDirs.push(dataDir);
  const server = createPlannerServer({
    dataFile: join(dataDir, "planner.json"),
    username: "me",
    password: "secret"
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
};

const startStaticServer = async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "desktop-planner-"));
  tempDirs.push(dataDir);
  const staticDir = join(dataDir, "dist");
  await mkdir(join(staticDir, "assets"), { recursive: true });
  await writeFile(join(staticDir, "index.html"), "<!doctype html><div id=\"root\"></div>", "utf8");
  await writeFile(join(staticDir, "assets", "app.js"), "console.log('planner');", "utf8");
  const server = createPlannerServer({
    dataFile: join(dataDir, "planner.json"),
    staticDir,
    username: "me",
    password: "secret"
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
};

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("planner server", () => {
  test("authenticates one configured user and rejects wrong credentials", async () => {
    const baseUrl = await startServer();

    const rejected = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "me", password: "wrong" })
    });
    expect(rejected.status).toBe(401);

    const accepted = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "me", password: "secret" })
    });
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toEqual({ token: expect.any(String) });
  });

  test("stores large plans for authenticated requests", async () => {
    const baseUrl = await startServer();
    const login = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "me", password: "secret" })
    });
    const { token } = await login.json();

    const plans = [
      {
        id: "plan-rust",
        title: "Rust 공부",
        createdAt: "2026-06-28T00:00:00.000Z",
        updatedAt: "2026-06-28T00:00:00.000Z"
      }
    ];

    const save = await fetch(`${baseUrl}/api/plans`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ plans })
    });
    expect(save.status).toBe(200);

    const load = await fetch(`${baseUrl}/api/plans`, {
      headers: { authorization: `Bearer ${token}` }
    });
    expect(load.status).toBe(200);
    await expect(load.json()).resolves.toEqual({ plans });
  });

  test("blocks unauthenticated plan reads and writes", async () => {
    const baseUrl = await startServer();

    const load = await fetch(`${baseUrl}/api/plans`);
    expect(load.status).toBe(401);

    const save = await fetch(`${baseUrl}/api/plans`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plans: [] })
    });
    expect(save.status).toBe(401);
  });

  test("serves the built app from the same server as the API", async () => {
    const baseUrl = await startStaticServer();

    const index = await fetch(`${baseUrl}/`);
    expect(index.status).toBe(200);
    expect(index.headers.get("content-type")).toContain("text/html");
    await expect(index.text()).resolves.toContain("<div id=\"root\"></div>");

    const asset = await fetch(`${baseUrl}/assets/app.js`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("content-type")).toContain("text/javascript");
    await expect(asset.text()).resolves.toContain("planner");

    const clientRoute = await fetch(`${baseUrl}/planner/today`);
    expect(clientRoute.status).toBe(200);
    await expect(clientRoute.text()).resolves.toContain("<div id=\"root\"></div>");
  });
});
