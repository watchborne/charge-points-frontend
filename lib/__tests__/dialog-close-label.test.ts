import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const SKIPPED_DIRS = new Set(["node_modules", ".next", "__tests__"]);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    if (SKIPPED_DIRS.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });

// The package ships no copy of its own: its close button reads "Close" unless
// the caller passes a translated `closeLabel`.
const TAG = /<(DialogContent|CommandDialog)\b[\s\S]*?>/g;

describe("dialog close button label", () => {
  it("SHOULD pass a closeLabel WHEN a component renders a DialogContent or CommandDialog", () => {
    const missing = sourceFiles(join(ROOT, "app")).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(TAG)]
        .filter(([tag]) => !tag.includes("closeLabel"))
        .map(([, name]) => `${relative(ROOT, file)}: <${name}> has no closeLabel`);
    });

    expect(missing).toEqual([]);
  });
});
