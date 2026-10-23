import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Nothing checks the manifest's icons at build time: every listed icon must
// exist.
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
