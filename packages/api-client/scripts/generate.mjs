// Regenerates src/generated/schema.d.ts from video-service's OpenAPI spec.
//
// The spec lives in a DIFFERENT repo (olum-backend/video-service/openapi), so
// there are three ways to point at it, tried in order:
//
//   1. OPENAPI_SPEC — an explicit path or URL. What CI uses, after downloading
//      the spec as a build artifact from the backend's pipeline.
//   2. The sibling checkout, if someone has both repos cloned side by side.
//   3. Give up with an actionable message.
//
// Guessing a relative path across repos and failing cryptically when it is
// absent is the thing this ordering exists to avoid.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "src/generated/schema.d.ts");

// Both repos under one parent, which is how they are checked out locally.
const SIBLING = resolve(
  process.cwd(),
  "../../../olum-backend/olum-backend/video-service/openapi/openapi.yaml",
);

function findSpec() {
  const explicit = process.env.OPENAPI_SPEC;
  if (explicit) {
    // A URL is handed to openapi-typescript as-is; it fetches it itself.
    if (/^https?:\/\//.test(explicit)) return explicit;
    if (existsSync(explicit)) return resolve(explicit);
    fail(`OPENAPI_SPEC is set to "${explicit}" but no file is there.`);
  }
  if (existsSync(SIBLING)) return SIBLING;

  fail(
    "Could not find video-service's openapi.yaml.\n\n" +
      `  Looked for a sibling checkout at:\n    ${SIBLING}\n\n` +
      "  Fix by either:\n" +
      "    • cloning olum-backend beside this repo, or\n" +
      "    • setting OPENAPI_SPEC to the spec's path or URL\n",
  );
}

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

const spec = findSpec();
mkdirSync(dirname(OUT), { recursive: true });
execFileSync("npx", ["openapi-typescript", spec, "-o", OUT], { stdio: "inherit", shell: true });
console.log(`\nGenerated ${OUT}\n  from ${spec}`);
