import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// public/manifest.json + its icons (#403) are static assets with no build-time
// check tying them together — a typo'd icon filename would only ever surface
// as a silently-missing home-screen icon on a real device. This pins the one
// thing that can drift: every icon the manifest lists actually exists.
describe("public/manifest.json", () => {
  const manifestPath = join(process.cwd(), "public", "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  it("SHOULD declare a standalone display mode", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("SHOULD list at least one maskable and one non-maskable icon", () => {
    const purposes = manifest.icons.map((icon: { purpose?: string }) => icon.purpose);
    expect(purposes).toContain("maskable");
    expect(purposes).toContain("any");
  });

  it("SHOULD reference only icon files that actually exist under public/", () => {
    for (const icon of manifest.icons as Array<{ src: string }>) {
      const iconPath = join(process.cwd(), "public", icon.src.replace(/^\//, ""));
      expect(existsSync(iconPath), `${icon.src} is listed in manifest.json but missing`).toBe(true);
    }
  });
});
