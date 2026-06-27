import { describe, expect, it, vi } from "vitest";
import { createPlanSyncClient, resolvePlanApiUrl } from "./planSyncClient";
import type { LargePlan, PlannerState } from "../model/types";

const createMemoryTokenStore = () => {
  let token: string | null = null;
  return {
    getItem: () => token,
    setItem: (_key: string, value: string) => {
      token = value;
    },
    removeItem: () => {
      token = null;
    }
  };
};

describe("plan sync client", () => {
  it("uses the current app origin when the built app is served by the planner server", () => {
    expect(resolvePlanApiUrl(undefined, { origin: "http://192.168.0.10:8787", port: "8787" })).toBe(
      "http://192.168.0.10:8787"
    );
  });

  it("prefers the current app origin over Vite env when served by the planner server", () => {
    expect(
      resolvePlanApiUrl("http://127.0.0.1:8787", { origin: "http://192.168.0.10:8787", port: "8787" })
    ).toBe("http://192.168.0.10:8787");
  });

  it("keeps the local API default while running through the Vite dev server", () => {
    expect(resolvePlanApiUrl(undefined, { origin: "http://127.0.0.1:5173", port: "5173" })).toBe(
      "http://127.0.0.1:8787"
    );
  });

  it("logs in and stores the returned token", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ token: "server-token" }), { status: 200 }));
    const tokenStore = createMemoryTokenStore();
    const client = createPlanSyncClient({ apiUrl: "http://planner.test", fetchImpl, tokenStore });

    await client.login("me", "secret");

    expect(client.getSession()).toEqual({ isAuthenticated: true });
    expect(fetchImpl).toHaveBeenCalledWith("http://planner.test/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "me", password: "secret" })
    });
  });

  it("loads and saves plans with bearer authentication", async () => {
    const plans: LargePlan[] = [
      {
        id: "plan-rust",
        title: "Rust 공부",
        createdAt: "2026-06-28T00:00:00.000Z",
        updatedAt: "2026-06-28T00:00:00.000Z"
      }
    ];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "server-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ plans }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ plans }), { status: 200 }));
    const client = createPlanSyncClient({
      apiUrl: "http://planner.test/",
      fetchImpl,
      tokenStore: createMemoryTokenStore()
    });

    await client.login("me", "secret");
    await expect(client.loadPlans()).resolves.toEqual(plans);
    await client.savePlans(plans);

    expect(fetchImpl).toHaveBeenNthCalledWith(2, "http://planner.test/api/plans", {
      headers: { authorization: "Bearer server-token" }
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(3, "http://planner.test/api/plans", {
      method: "PUT",
      headers: { authorization: "Bearer server-token", "content-type": "application/json" },
      body: JSON.stringify({ state: { largePlans: plans, dailyEntries: {} } })
    });
  });

  it("loads and saves the full planner state with detail items", async () => {
    const state: PlannerState = {
      largePlans: [
        {
          id: "plan-rust",
          title: "Rust",
          createdAt: "2026-06-28T00:00:00.000Z",
          updatedAt: "2026-06-28T00:00:00.000Z"
        }
      ],
      dailyEntries: {
        "2026-06-28": [
          {
            id: "entry-rust",
            date: "2026-06-28",
            largePlanId: "plan-rust",
            order: 0,
            status: "waiting",
            createdAt: "2026-06-28T00:00:00.000Z",
            updatedAt: "2026-06-28T00:00:00.000Z",
            detailItems: [
              {
                id: "detail-1",
                title: "Rust lesson",
                order: 0,
                status: "in_progress",
                createdAt: "2026-06-28T00:00:00.000Z",
                updatedAt: "2026-06-28T00:00:00.000Z"
              }
            ]
          }
        ]
      }
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "server-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state }), { status: 200 }));
    const client = createPlanSyncClient({
      apiUrl: "http://planner.test/",
      fetchImpl,
      tokenStore: createMemoryTokenStore()
    });

    await client.login("me", "secret");
    await expect(client.loadState()).resolves.toEqual(state);
    await client.saveState(state);

    expect(fetchImpl).toHaveBeenNthCalledWith(3, "http://planner.test/api/plans", {
      method: "PUT",
      headers: { authorization: "Bearer server-token", "content-type": "application/json" },
      body: JSON.stringify({ state })
    });
  });

  it("clears the session when the server rejects the token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "server-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
    const client = createPlanSyncClient({
      apiUrl: "http://planner.test",
      fetchImpl,
      tokenStore: createMemoryTokenStore()
    });

    await client.login("me", "secret");
    await expect(client.loadPlans()).rejects.toThrow("unauthorized");

    expect(client.getSession()).toEqual({ isAuthenticated: false });
  });
});
