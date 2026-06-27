import { describe, expect, it, vi } from "vitest";
import { createRedisPlanStore } from "./redisPlanStore.mjs";

describe("redis plan store", () => {
  it("loads plans through Upstash Redis REST", async () => {
    const plans = [
      {
        id: "plan-rust",
        title: "Rust 학습",
        createdAt: "2026-06-28T00:00:00.000Z",
        updatedAt: "2026-06-28T00:00:00.000Z"
      }
    ];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ result: JSON.stringify({ plans }) })));
    const store = createRedisPlanStore({
      redisUrl: "https://redis.example.com/",
      redisToken: "secret",
      key: "planner:test",
      fetchImpl
    });

    await expect(store.loadPlans()).resolves.toEqual(plans);
    expect(fetchImpl).toHaveBeenCalledWith("https://redis.example.com", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify(["GET", "planner:test"])
    });
  });

  it("saves plans through Upstash Redis REST", async () => {
    const plans = [
      {
        id: "plan-english",
        title: "영어 회화",
        createdAt: "2026-06-28T00:00:00.000Z",
        updatedAt: "2026-06-28T00:00:00.000Z"
      }
    ];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ result: "OK" })));
    const store = createRedisPlanStore({
      redisUrl: "https://redis.example.com",
      redisToken: "secret",
      key: "planner:test",
      fetchImpl
    });

    await store.savePlans(plans);

    expect(fetchImpl).toHaveBeenCalledWith("https://redis.example.com", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify(["SET", "planner:test", JSON.stringify({ state: { largePlans: plans, dailyEntries: {} } })])
    });
  });

  it("loads and saves full planner state through Upstash Redis REST", async () => {
    const state = {
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
                id: "detail-rust",
                title: "Rust lesson",
                order: 0,
                status: "done",
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
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: JSON.stringify({ state }) })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: "OK" })));
    const store = createRedisPlanStore({
      redisUrl: "https://redis.example.com",
      redisToken: "secret",
      key: "planner:test",
      fetchImpl
    });

    await expect(store.loadState()).resolves.toEqual(state);
    await store.saveState(state);

    expect(fetchImpl).toHaveBeenNthCalledWith(2, "https://redis.example.com", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify(["SET", "planner:test", JSON.stringify({ state })])
    });
  });

  it("fails fast when Redis environment is missing", async () => {
    expect(() => createRedisPlanStore({ redisUrl: "", redisToken: "secret" })).toThrow("missing_upstash_config");
    expect(() => createRedisPlanStore({ redisUrl: "https://redis.example.com", redisToken: "" })).toThrow(
      "missing_upstash_config"
    );
  });
});
