import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
let environmentLoaded = false;

function quoteMultilineServiceAccount(source) {
  const assignment = /(^|\r?\n)([ \t]*FIREBASE_SERVICE_ACCOUNT_JSON[ \t]*=[ \t]*)(\{)/.exec(source);
  if (!assignment) {
    return source;
  }

  const valueStart = assignment.index + assignment[0].length - 1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = valueStart; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return `${source.slice(0, valueStart)}'${source.slice(valueStart, index + 1)}'${source.slice(index + 1)}`;
      }
    }
  }

  return source;
}

export function loadBackendEnvironment() {
  if (environmentLoaded) {
    return;
  }

  const envPath = path.join(backendDirectory, ".env");
  let envContents = "";
  try {
    envContents = fs.readFileSync(envPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const backendVariables = dotenv.parse(quoteMultilineServiceAccount(envContents));
  for (const [name, value] of Object.entries(backendVariables)) {
    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  }

  dotenv.config();
  environmentLoaded = true;
}
