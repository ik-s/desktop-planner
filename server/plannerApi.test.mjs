import { describe, expect, it, vi } from "vitest";
import { createLoginHandler, createPlansHandler, makeToken } from "./plannerApi.mjs";

const createMockResponse = () => {
  const response = {
    statusCode: undefined,
    body: undefined,
    headers: {},
    setHeader: vi.fn((key, value) => {
      response.headers[key] = value;
    }),
    status: vi.fn((statusCode) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((body) => {
      response.body = body;
      return response;
    }),
    end: vi.fn(() => response)
  };
  return response;
};

describe("planner API handlers", () => {
  it("logs in with the fixed planner account", async () => {
    const handler = createLoginHandler({ username: "me", password: "secret" });
    const response = createMockResponse();

    await handler({ method: "POST", body: { username: "me", password: "secret" } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.body).toEqual({ token: makeToken("me", "secret") });
  });

  it("rejects unauthenticated plan reads", async () => {
    const handler = createPlansHandler({
      username: "me",
      password: "secret",
      store: { loadPlans: vi.fn(), savePlans: vi.fn() }
    });
    const response = createMockResponse();

    await handler({ method: "GET", headers: {} }, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.body).toEqual({ error: "unauthorized" });
  });

  it("loads and saves plans for authenticated requests", async () => {
    const plans = [
      {
        id: "plan-rust",
        title: "Rust 학습",
        createdAt: "2026-06-28T00:00:00.000Z",
        updatedAt: "2026-06-28T00:00:00.000Z"
      }
    ];
    const store = { loadPlans: vi.fn().mockResolvedValue(plans), savePlans: vi.fn().mockResolvedValue(undefined) };
    const handler = createPlansHandler({ username: "me", password: "secret", store });
    const headers = { authorization: `Bearer ${makeToken("me", "secret")}` };

    const loadResponse = createMockResponse();
    await handler({ method: "GET", headers }, loadResponse);
    expect(loadResponse.status).toHaveBeenCalledWith(200);
    expect(loadResponse.body).toEqual({ plans });

    const saveResponse = createMockResponse();
    await handler({ method: "PUT", headers, body: { plans } }, saveResponse);
    expect(store.savePlans).toHaveBeenCalledWith(plans);
    expect(saveResponse.status).toHaveBeenCalledWith(200);
  });
});
