import { describe, expect, test } from "vitest";
import { parseEnvFile } from "./env.mjs";

describe("parseEnvFile", () => {
  test("parses simple dotenv values without overriding process syntax", () => {
    expect(
      parseEnvFile(`
PLANNER_USERNAME=me
PLANNER_PASSWORD="secret value"
IGNORED_LINE
VITE_PLANNER_API_URL=http://127.0.0.1:8787
`)
    ).toEqual({
      PLANNER_USERNAME: "me",
      PLANNER_PASSWORD: "secret value",
      VITE_PLANNER_API_URL: "http://127.0.0.1:8787"
    });
  });
});
