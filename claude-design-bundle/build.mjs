/**
 * Claude Design — preview bundle generator
 * --------------------------------------------------------------------------
 * Produces standalone HTML preview cards for the Watchborne Design System so
 * they can be pushed to a claude.ai/design project via the DesignSync tool.
 *
 * Each generated file:
 *   - is fully self-contained (Tailwind CDN + the repo's tailwind color map +
 *     the real design tokens from app/design-system/tokens.css inlined),
 *   - opens with a `<!-- @dsCard ... -->` marker so the Design System pane
 *     indexes it automatically (no manual register_assets needed).
 *
 * Run:  node claude-design-bundle/build.mjs
 * Out:  claude-design-bundle/dist/**.html  +  manifest.json (planning aid)
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const outDir = join(__dirname, "dist");

// --- Pull the real tokens straight from the repo so previews never drift ----
// Strip the Google Fonts @import (re-added once, at the very top of the head).
const FONTS_IMPORT = `@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");`;
const tokensCss = readFileSync(join(repoRoot, "app/design-system/tokens.css"), "utf8")
  .replace(/@import url\([^)]*\);/g, "");

// shadcn HSL vars (from app/globals.css @layer base :root) needed by bg-primary etc.
const shadcnVars = `
:root{
  --background:0 0% 100%;--foreground:222.2 84% 4.9%;
  --card:0 0% 100%;--card-foreground:222.2 84% 4.9%;
  --popover:0 0% 100%;--popover-foreground:222.2 84% 4.9%;
  --primary:222.2 47.4% 11.2%;--primary-foreground:210 40% 98%;
  --secondary:210 40% 96.1%;--secondary-foreground:222.2 47.4% 11.2%;
  --muted:210 40% 96.1%;--muted-foreground:215.4 16.3% 46.9%;
  --accent:210 40% 96.1%;--accent-foreground:222.2 47.4% 11.2%;
  --destructive:0 84.2% 60.2%;--destructive-foreground:210 40% 98%;
  --border:214.3 31.8% 91.4%;--input:214.3 31.8% 91.4%;--ring:222.2 84% 4.9%;
  --radius:0.5rem;
}`;

// Mirror of tailwind.config.js color/token mapping, for the Tailwind CDN runtime.
const twConfig = `
tailwind.config = {
  theme: { extend: {
    borderRadius: { lg:"var(--radius)", md:"calc(var(--radius) - 2px)", sm:"calc(var(--radius) - 4px)",
      "wb-sm":"var(--r-sm)", "wb-md":"var(--r-md)", "wb-lg":"var(--r-lg)" },
    colors: {
      background:"hsl(var(--background))", foreground:"hsl(var(--foreground))",
      card:{DEFAULT:"hsl(var(--card))",foreground:"hsl(var(--card-foreground))"},
      popover:{DEFAULT:"hsl(var(--popover))",foreground:"hsl(var(--popover-foreground))"},
      primary:{DEFAULT:"hsl(var(--primary))",foreground:"hsl(var(--primary-foreground))"},
      secondary:{DEFAULT:"hsl(var(--secondary))",foreground:"hsl(var(--secondary-foreground))"},
      muted:{DEFAULT:"hsl(var(--muted))",foreground:"hsl(var(--muted-foreground))"},
      accent:{DEFAULT:"hsl(var(--accent))",foreground:"hsl(var(--accent-foreground))"},
      destructive:{DEFAULT:"hsl(var(--destructive))",foreground:"hsl(var(--destructive-foreground))"},
      border:"hsl(var(--border))", input:"hsl(var(--input))", ring:"hsl(var(--ring))",
      ink:{50:"var(--ink-50)",100:"var(--ink-100)",200:"var(--ink-200)",400:"var(--ink-400)",600:"var(--ink-600)",700:"var(--ink-700)",800:"var(--ink-800)",900:"var(--ink-900)"},
      charge:{50:"var(--charge-50)",100:"var(--charge-100)",200:"var(--charge-200)",400:"var(--charge-400)",500:"var(--charge-500)",600:"var(--charge-600)",700:"var(--charge-700)"},
      "st-available":{100:"var(--st-available-100)",500:"var(--st-available-500)",700:"var(--st-available-700)"},
      "st-charging":{100:"var(--st-charging-100)",500:"var(--st-charging-500)",700:"var(--st-charging-700)"},
      "st-error":{100:"var(--st-error-100)",500:"var(--st-error-500)",700:"var(--st-error-700)"},
      "st-offline":{100:"var(--st-offline-100)",500:"var(--st-offline-500)",700:"var(--st-offline-700)"},
      "st-maint":{100:"var(--st-maint-100)",500:"var(--st-maint-500)",700:"var(--st-maint-700)"},
    },
    fontFamily:{ display:["Space Grotesk","sans-serif"], body:["Inter","sans-serif"], mono:["IBM Plex Mono","monospace"] },
  }},
};`;

function page({ group, title, subtitle = "", body, pad = "p-8" }) {
  return `<!-- @dsCard group="${group}" -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>${FONTS_IMPORT}
/*__TAILWIND_CSS__*/
${shadcnVars}
${tokensCss}
  body{font-family:var(--font-body);background:var(--bg-page);color:var(--text-primary);-webkit-font-smoothing:antialiased;}
  h1,h2,h3,h4{font-family:var(--font-display);font-weight:600;letter-spacing:-0.01em;}
  .mono{font-family:var(--font-mono);}
  .card-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:6px;font-weight:600;}
</style>
</head>
<body class="${pad}">
<header class="mb-6">
  <h2 class="text-lg">${title}</h2>
  ${subtitle ? `<p class="text-sm" style="color:var(--text-secondary)">${subtitle}</p>` : ""}
</header>
${body}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Foundations
// ---------------------------------------------------------------------------
const swatch = (name, varName) =>
  `<div class="flex flex-col gap-1">
     <div class="h-12 rounded-wb-md border" style="background:var(${varName});border-color:var(--border-subtle)"></div>
     <span class="text-xs font-medium">${name}</span>
     <span class="text-[10px] mono" style="color:var(--text-tertiary)">${varName}</span>
   </div>`;

const ramp = (label, names) =>
  `<div class="mb-6"><div class="card-label">${label}</div>
     <div class="grid grid-cols-4 sm:grid-cols-8 gap-3">${names.map(([n, v]) => swatch(n, v)).join("")}</div></div>`;

const foundationColors = page({
  group: "Foundations",
  title: "Colors",
  subtitle: "Volt Ink brand · Charge Amber accent · charge-point status states · UI neutrals",
  body:
    ramp("Volt Ink (brand)", [["900","--ink-900"],["800","--ink-800"],["700","--ink-700"],["600","--ink-600"],["400","--ink-400"],["200","--ink-200"],["100","--ink-100"],["50","--ink-50"]]) +
    ramp("Charge Amber (accent)", [["700","--charge-700"],["600","--charge-600"],["500","--charge-500"],["400","--charge-400"],["200","--charge-200"],["100","--charge-100"],["50","--charge-50"]]) +
    ramp("Status — Available", [["700","--st-available-700"],["500","--st-available-500"],["100","--st-available-100"]]) +
    ramp("Status — Charging", [["700","--st-charging-700"],["500","--st-charging-500"],["100","--st-charging-100"]]) +
    ramp("Status — Error", [["700","--st-error-700"],["500","--st-error-500"],["100","--st-error-100"]]) +
    ramp("Status — Offline", [["700","--st-offline-700"],["500","--st-offline-500"],["100","--st-offline-100"]]) +
    ramp("Status — Maintenance", [["700","--st-maint-700"],["500","--st-maint-500"],["100","--st-maint-100"]]) +
    ramp("UI neutrals", [["page","--bg-page"],["surface","--bg-surface"],["sunken","--bg-sunken"],["border","--border-default"],["text 1","--text-primary"],["text 2","--text-secondary"],["text 3","--text-tertiary"]]),
});

const foundationType = page({
  group: "Foundations",
  title: "Typography",
  subtitle: "Space Grotesk (display) · Inter (body) · IBM Plex Mono",
  body: `
  <div class="space-y-5">
    <div><div class="card-label">Display · Space Grotesk</div>
      <p style="font-family:var(--font-display);font-weight:600" class="text-4xl">Charge points realm</p>
      <p style="font-family:var(--font-display);font-weight:600" class="text-2xl">Real-time dashboard</p>
    </div>
    <div><div class="card-label">Body · Inter</div>
      <p class="text-base">The quick brown fox monitors 248 charge points.</p>
      <p class="text-sm" style="color:var(--text-secondary)">Secondary text — 14px / Inter 400.</p>
    </div>
    <div><div class="card-label">Mono · IBM Plex Mono</div>
      <p class="mono text-sm">CP-0042 · 22.4 kW · SYNCED</p>
    </div>
  </div>`,
});

const foundationSpacing = page({
  group: "Foundations",
  title: "Spacing · Radius · Shadow",
  subtitle: "4px base scale · radius tokens · card elevation",
  body: `
  <div class="mb-6"><div class="card-label">Spacing (base-4)</div>
    <div class="space-y-2">
    ${[["xs","--space-xs"],["sm","--space-sm"],["md","--space-md"],["base","--space-base"],["lg","--space-lg"],["xl","--space-xl"],["2xl","--space-2xl"]]
      .map(([n,v]) => `<div class="flex items-center gap-3"><span class="w-12 text-xs mono">${n}</span><div style="height:14px;width:var(${v});background:var(--charge-500);border-radius:3px"></div><span class="text-[10px] mono" style="color:var(--text-tertiary)">${v}</span></div>`).join("")}
    </div>
  </div>
  <div class="mb-6"><div class="card-label">Radius</div>
    <div class="flex gap-4">
    ${[["sm","--r-sm"],["md","--r-md"],["lg","--r-lg"]].map(([n,v]) => `<div class="flex flex-col items-center gap-1"><div class="h-16 w-16 bg-ink-100 border" style="border-radius:var(${v});border-color:var(--border-default)"></div><span class="text-xs mono">${n}</span></div>`).join("")}
    </div>
  </div>
  <div><div class="card-label">Shadow</div>
    <div class="h-20 w-40 bg-white rounded-wb-md" style="box-shadow:var(--shadow-card)"></div>
  </div>`,
});

// ---------------------------------------------------------------------------
// Components (components/ui) — faithful to each component's cva/class strings
// ---------------------------------------------------------------------------
const btn = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors";
const components = [
  {
    file: "button", title: "Button", subtitle: "6 variants · 4 sizes",
    body: `
    <div class="space-y-5">
      <div><div class="card-label">Variants</div><div class="flex flex-wrap gap-3 items-center">
        <button class="${btn} h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">Default</button>
        <button class="${btn} h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm">Secondary</button>
        <button class="${btn} h-9 px-4 py-2 bg-destructive text-destructive-foreground shadow-sm">Destructive</button>
        <button class="${btn} h-9 px-4 py-2 border border-input bg-background shadow-sm">Outline</button>
        <button class="${btn} h-9 px-4 py-2">Ghost</button>
        <button class="${btn} h-9 px-4 py-2 text-primary underline-offset-4 hover:underline">Link</button>
      </div></div>
      <div><div class="card-label">Sizes</div><div class="flex flex-wrap gap-3 items-center">
        <button class="${btn} h-8 rounded-md px-3 text-xs bg-primary text-primary-foreground shadow">Small</button>
        <button class="${btn} h-9 px-4 py-2 bg-primary text-primary-foreground shadow">Default</button>
        <button class="${btn} h-10 rounded-md px-8 bg-primary text-primary-foreground shadow">Large</button>
        <button class="${btn} h-9 w-9 bg-primary text-primary-foreground shadow">＋</button>
      </div></div>
      <div><div class="card-label">Disabled</div>
        <button disabled class="${btn} h-9 px-4 py-2 bg-primary text-primary-foreground shadow opacity-50 pointer-events-none">Default</button>
      </div>
    </div>`,
  },
  {
    file: "badge", title: "Badge", subtitle: "4 variants",
    body: `<div class="flex flex-wrap gap-3 items-center">
      <div class="inline-flex items-center rounded-md border border-transparent bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold shadow">Default</div>
      <div class="inline-flex items-center rounded-md border border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">Secondary</div>
      <div class="inline-flex items-center rounded-md border border-transparent bg-destructive text-destructive-foreground px-2.5 py-0.5 text-xs font-semibold shadow">Destructive</div>
      <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-foreground" style="border-color:hsl(var(--border))">Outline</div>
    </div>`,
  },
  {
    file: "status-badge", title: "StatusBadge", subtitle: "Charge-point connection states",
    body: `<div class="flex flex-wrap gap-3 items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white bg-yellow-500">connected</span>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white bg-green-500">synced</span>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white bg-slate-500">offline</span>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white bg-orange-500">warning</span>
    </div>`,
  },
  {
    file: "input", title: "Input", subtitle: "Text field · with label · disabled",
    body: `<div class="max-w-sm space-y-4">
      <input placeholder="e.g. CP-0042" class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm" style="border-color:hsl(var(--input))"/>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Charge point ID</label>
        <input value="CP-0042" class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm" style="border-color:hsl(var(--input))"/>
      </div>
      <input disabled placeholder="Disabled" class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm opacity-50" style="border-color:hsl(var(--input))"/>
    </div>`,
  },
  {
    file: "switch", title: "Switch", subtitle: "On / off",
    body: `<div class="flex items-center gap-6">
      <span class="inline-flex h-5 w-9 items-center rounded-full bg-primary px-0.5"><span class="h-4 w-4 rounded-full bg-background shadow-lg translate-x-4 transition-transform"></span></span>
      <span class="inline-flex h-5 w-9 items-center rounded-full px-0.5" style="background:hsl(var(--input))"><span class="h-4 w-4 rounded-full bg-background shadow-lg transition-transform"></span></span>
    </div>`,
  },
  {
    file: "label", title: "Label", subtitle: "Form label",
    body: `<label class="text-sm font-medium leading-none">Email address</label>`,
  },
  {
    file: "tabs", title: "Tabs", subtitle: "Segmented navigation",
    body: `<div class="max-w-md">
      <div class="inline-flex h-9 items-center justify-center rounded-lg p-1 text-muted-foreground" style="background:hsl(var(--muted))">
        <button class="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium bg-background text-foreground shadow">Overview</button>
        <button class="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium">Sessions</button>
        <button class="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium">Settings</button>
      </div>
      <div class="mt-3 text-sm" style="color:var(--text-secondary)">Overview panel content…</div>
    </div>`,
  },
  {
    file: "select", title: "Select", subtitle: "Dropdown trigger + open menu",
    body: `<div class="max-w-xs">
      <button class="flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm" style="border-color:hsl(var(--input))"><span>All sites</span><span style="color:var(--text-tertiary)">▾</span></button>
      <div class="mt-1 w-full rounded-md border bg-white p-1 shadow-md" style="border-color:var(--border-subtle)">
        <div class="rounded-sm px-2 py-1.5 text-sm bg-accent">All sites</div>
        <div class="rounded-sm px-2 py-1.5 text-sm">Lyon — Confluence</div>
        <div class="rounded-sm px-2 py-1.5 text-sm">Paris — La Défense</div>
      </div>
    </div>`,
  },
  {
    file: "dropdown-menu", title: "Dropdown Menu", subtitle: "Action menu",
    body: `<div class="w-56 rounded-md border bg-white p-1 shadow-md" style="border-color:var(--border-subtle)">
      <div class="px-2 py-1.5 text-xs font-semibold" style="color:var(--text-tertiary)">Actions</div>
      <div class="rounded-sm px-2 py-1.5 text-sm">Edit</div>
      <div class="rounded-sm px-2 py-1.5 text-sm">Duplicate</div>
      <div class="my-1 h-px" style="background:var(--border-subtle)"></div>
      <div class="rounded-sm px-2 py-1.5 text-sm text-destructive">Delete</div>
    </div>`,
  },
  {
    file: "dialog", title: "Dialog", subtitle: "Modal surface",
    body: `<div class="max-w-lg rounded-lg border bg-white p-6 shadow-lg" style="border-color:var(--border-subtle)">
      <h3 class="text-lg font-semibold">Edit charge point</h3>
      <p class="text-sm mt-1" style="color:var(--text-secondary)">Update the configuration for CP-0042.</p>
      <div class="mt-4 space-y-1.5"><label class="text-sm font-medium">Name</label>
        <input value="CP-0042" class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm" style="border-color:hsl(var(--input))"/></div>
      <div class="mt-6 flex justify-end gap-2">
        <button class="${btn} h-9 px-4 border border-input bg-background shadow-sm">Cancel</button>
        <button class="${btn} h-9 px-4 bg-primary text-primary-foreground shadow">Save</button>
      </div>
    </div>`,
  },
  {
    file: "alert-dialog", title: "Alert Dialog", subtitle: "Destructive confirmation",
    body: `<div class="max-w-lg rounded-lg border bg-white p-6 shadow-lg" style="border-color:var(--border-subtle)">
      <h3 class="text-lg font-semibold">Delete charge point?</h3>
      <p class="text-sm mt-1" style="color:var(--text-secondary)">This action cannot be undone. CP-0042 will be permanently removed.</p>
      <div class="mt-6 flex justify-end gap-2">
        <button class="${btn} h-9 px-4 border border-input bg-background shadow-sm">Cancel</button>
        <button class="${btn} h-9 px-4 bg-destructive text-destructive-foreground shadow">Delete</button>
      </div>
    </div>`,
  },
  {
    file: "popover", title: "Popover", subtitle: "Floating panel",
    body: `<div class="w-72 rounded-md border bg-white p-4 shadow-md" style="border-color:var(--border-subtle)">
      <div class="card-label">Dimensions</div>
      <p class="text-sm" style="color:var(--text-secondary)">Set the size of the panel here.</p>
    </div>`,
  },
  {
    file: "command", title: "Command", subtitle: "Command palette / combobox",
    body: `<div class="max-w-md rounded-lg border bg-white shadow-md overflow-hidden" style="border-color:var(--border-subtle)">
      <div class="flex items-center border-b px-3" style="border-color:var(--border-subtle)"><span style="color:var(--text-tertiary)">⌕</span><input placeholder="Search site…" class="flex h-10 w-full bg-transparent px-2 text-sm outline-none"/></div>
      <div class="p-1">
        <div class="px-2 py-1.5 text-xs font-semibold" style="color:var(--text-tertiary)">Sites</div>
        <div class="rounded-sm px-2 py-1.5 text-sm bg-accent">Lyon — Confluence</div>
        <div class="rounded-sm px-2 py-1.5 text-sm">Paris — La Défense</div>
        <div class="rounded-sm px-2 py-1.5 text-sm">Marseille — Vieux-Port</div>
      </div>
    </div>`,
  },
  {
    file: "table", title: "Table", subtitle: "Data table",
    body: `<div class="rounded-md border overflow-hidden" style="border-color:var(--border-subtle)">
      <table class="w-full text-sm">
        <thead><tr class="border-b" style="border-color:var(--border-subtle);color:var(--text-secondary)">
          <th class="h-10 px-4 text-left font-medium">ID</th><th class="h-10 px-4 text-left font-medium">Site</th>
          <th class="h-10 px-4 text-left font-medium">Power</th><th class="h-10 px-4 text-left font-medium">Status</th></tr></thead>
        <tbody>
          ${[["CP-0042","Lyon","22.4 kW","synced","bg-green-500"],["CP-0043","Paris","11.0 kW","connected","bg-yellow-500"],["CP-0044","Marseille","—","offline","bg-slate-500"]]
            .map(([id,site,p,s,c]) => `<tr class="border-b" style="border-color:var(--border-subtle)"><td class="p-4 mono">${id}</td><td class="p-4">${site}</td><td class="p-4">${p}</td><td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white ${c}">${s}</span></td></tr>`).join("")}
        </tbody>
      </table>
    </div>`,
  },
  {
    file: "collapsible", title: "Collapsible", subtitle: "Expandable section",
    body: `<div class="max-w-md rounded-md border" style="border-color:var(--border-subtle)">
      <button class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">Connectors (3)<span style="color:var(--text-tertiary)">▾</span></button>
      <div class="border-t px-4 py-3 text-sm space-y-1" style="border-color:var(--border-subtle);color:var(--text-secondary)"><div>Type 2 — 22 kW</div><div>CCS — 50 kW</div><div>CHAdeMO — 50 kW</div></div>
    </div>`,
  },
  {
    file: "calendar", title: "Calendar", subtitle: "Date grid (react-day-picker)",
    body: `<div class="inline-block rounded-md border bg-white p-3 shadow-sm" style="border-color:var(--border-subtle)">
      <div class="flex items-center justify-between mb-2 px-1"><span style="color:var(--text-tertiary)">‹</span><span class="text-sm font-medium">June 2026</span><span style="color:var(--text-tertiary)">›</span></div>
      <table class="text-sm"><thead><tr>${["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>`<th class="h-8 w-8 font-normal" style="color:var(--text-tertiary)">${d}</th>`).join("")}</tr></thead>
      <tbody>${[1,2,3].map(w=>`<tr>${[0,1,2,3,4,5,6].map(d=>{const n=(w-1)*7+d+1;const sel=n===25;return `<td class="h-8 w-8 text-center align-middle"><span class="inline-flex h-8 w-8 items-center justify-center rounded-md ${sel?'bg-primary text-primary-foreground':''}">${n}</span></td>`;}).join("")}</tr>`).join("")}</tbody></table>
    </div>`,
  },
  {
    file: "datepicker", title: "Date Picker", subtitle: "Trigger button",
    body: `<button class="${btn} h-9 px-4 border border-input bg-background shadow-sm gap-2" style="color:var(--text-secondary)">📅 June 25, 2026</button>`,
  },
  {
    file: "form", title: "Form", subtitle: "react-hook-form + zod field layout",
    body: `<form class="max-w-sm space-y-4">
      <div class="space-y-1.5"><label class="text-sm font-medium">Charge point name</label>
        <input value="CP-0042" class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm" style="border-color:hsl(var(--input))"/>
        <p class="text-xs" style="color:var(--text-tertiary)">Displayed across the dashboard.</p></div>
      <div class="space-y-1.5"><label class="text-sm font-medium text-destructive">Power output</label>
        <input class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm" style="border-color:hsl(var(--destructive))"/>
        <p class="text-xs text-destructive">Power output is required.</p></div>
      <button class="${btn} h-9 px-4 bg-primary text-primary-foreground shadow w-full">Submit</button>
    </form>`,
  },
];

// ---------------------------------------------------------------------------
// Emit files + a manifest (used to drive the DesignSync finalize_plan)
// ---------------------------------------------------------------------------
mkdirSync(join(outDir, "foundations"), { recursive: true });
mkdirSync(join(outDir, "components"), { recursive: true });

const manifest = [];
const emit = (path, html, meta) => {
  writeFileSync(join(outDir, path), html);
  manifest.push({ path, ...meta });
};

emit("foundations/colors.html", foundationColors, { name: "Colors", group: "Foundations", viewport: { width: 760, height: 620 } });
emit("foundations/typography.html", foundationType, { name: "Typography", group: "Foundations", viewport: { width: 640, height: 420 } });
emit("foundations/spacing.html", foundationSpacing, { name: "Spacing · Radius · Shadow", group: "Foundations", viewport: { width: 560, height: 560 } });

for (const c of components) {
  emit(
    `components/${c.file}.html`,
    page({ group: "Components", title: c.title, subtitle: c.subtitle, body: c.body }),
    { name: c.title, subtitle: c.subtitle, group: "Components", viewport: { width: 640, height: 420 } },
  );
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Generated ${manifest.length} preview cards into claude-design-bundle/dist/`);

// ---------------------------------------------------------------------------
// Compile a real Tailwind stylesheet from the generated HTML and inline it
// into every card, so each preview is fully self-contained (no CDN at render).
// ---------------------------------------------------------------------------
const twConfigPath = join(__dirname, "tailwind.preview.config.js");
const twInPath = join(__dirname, ".tw-in.css");
const twOutPath = join(__dirname, ".tw-out.css");
writeFileSync(twInPath, "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");

console.log("Compiling Tailwind…");
execSync(
  `npx --yes tailwindcss@3.4.0 -i "${twInPath}" -o "${twOutPath}" --config "${twConfigPath}" --minify`,
  { cwd: repoRoot, stdio: "inherit" },
);
const compiled = readFileSync(twOutPath, "utf8");

let injected = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walk(p);
    else if (name.name.endsWith(".html")) {
      const html = readFileSync(p, "utf8").replace("/*__TAILWIND_CSS__*/", compiled);
      writeFileSync(p, html);
      injected++;
    }
  }
};
walk(outDir);
console.log(`Inlined compiled Tailwind into ${injected} cards. Bundle ready.`);
