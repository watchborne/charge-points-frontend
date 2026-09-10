#!/usr/bin/env node
/**
 * Fails when the declared `@watchborne/charge-points-types` range in
 * package.json excludes the package's latest published version.
 *
 * The two consumers of this shared domain contract (this repo and
 * charge-points-server) drifted a minor version apart with nothing to catch
 * it (issue #389): `^0.32.0` on a `0.x` package pins the minor — it never
 * resolves to `0.33.0` on its own, however long `npm install` is run for.
 * `update-types-dependency.yml` opens the bump PR on release, but nothing
 * flags it going unmerged. This does, by asking the registry itself rather
 * than trusting the lockfile: it resolves both "latest" and "what our range
 * allows" through `npm view` and fails loudly when they disagree.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PACKAGE_NAME = "@watchborne/charge-points-types";

const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const declaredRange = packageJson.dependencies?.[PACKAGE_NAME];

if (!declaredRange) {
  console.error(`❌ ${PACKAGE_NAME} is not listed in package.json dependencies.`);
  process.exit(1);
}

/**
 * `npm view <spec> version` against the real registry — resolves the actual
 * highest version, not whatever happens to be in package-lock.json, so a
 * stale lockfile can't hide a drifted range.
 */
const viewVersion = (spec) => {
  const output = execFileSync("npm", ["view", spec, "version"], {
    encoding: "utf8",
  }).trim();
  // A single matching version prints one bare line; npm never returns
  // multiple lines for a plain `version` field query in this shape.
  return output.split("\n").pop();
};

let latest;
let resolvedByRange;

try {
  latest = viewVersion(PACKAGE_NAME);
  resolvedByRange = viewVersion(`${PACKAGE_NAME}@${declaredRange}`);
} catch (error) {
  console.error(`❌ Could not query the registry for ${PACKAGE_NAME}: ${error.message}`);
  process.exit(1);
}

if (latest !== resolvedByRange) {
  console.error(
    `❌ ${PACKAGE_NAME}'s declared range "${declaredRange}" resolves to ${resolvedByRange}, ` +
      `but the latest published version is ${latest}.\n` +
      `   A caret range on a 0.x package pins the minor — it will never reach ${latest} on its own.\n` +
      `   Bump the dependency in package.json (and regenerate package-lock.json) to pick it up.`,
  );
  process.exit(1);
}

console.log(
  `✅ ${PACKAGE_NAME}@${declaredRange} resolves to the latest published version (${latest}).`,
);
