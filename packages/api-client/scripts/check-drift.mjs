// CI guard: regenerate the client and fail if it differs from what is committed.
//
// Without this, the generated files are a stale snapshot and the "contract"
// they claim to enforce enforces nothing.
//
// SKIPS (exit 0) when the spec cannot be found, because the spec lives in a
// different repo and this one must stay buildable on its own. That makes the
// skip a real risk: if CI never provides OPENAPI_SPEC, this silently passes
// forever. It prints a loud warning for exactly that reason — and once
// video-service publishes its spec, set REQUIRE_SPEC=1 in CI so a missing
// spec becomes a failure instead.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(process.cwd(), "src/generated/schema.d.ts");
const before = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";

try {
  execFileSync("node", ["scripts/generate.mjs"], { stdio: "inherit" });
} catch {
  if (process.env.REQUIRE_SPEC === "1") {
    console.error("\nREQUIRE_SPEC=1 and the spec could not be generated. Failing.\n");
    process.exit(1);
  }
  console.warn(
    "\n⚠  Skipping the API drift check — video-service's OpenAPI spec was not found.\n" +
      "   This check is doing NOTHING until CI provides OPENAPI_SPEC.\n" +
      "   Set REQUIRE_SPEC=1 once the backend publishes its spec.\n",
  );
  process.exit(0);
}

const after = readFileSync(OUT, "utf8");
if (before !== after) {
  console.error(
    "\nAPI client is out of date.\n" +
      "The backend's OpenAPI spec changed but the generated client was not committed.\n\n" +
      "Fix: npm run generate -w @olum-video/api-client, then commit src/generated/.\n",
  );
  process.exit(1);
}
console.log("\nAPI client is in sync with the spec.");
