import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const parseEnvFile = (content) =>
  Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const equalsIndex = line.indexOf("=");
        const key = line.slice(0, equalsIndex).trim();
        let value = line.slice(equalsIndex + 1).trim();
        if (
          (value.startsWith("\"") && value.endsWith("\"")) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value];
      })
  );

export const loadLocalEnv = async (envFile = resolve(process.cwd(), ".env")) => {
  try {
    const values = parseEnvFile(await readFile(envFile, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};
