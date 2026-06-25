# Claude Design bundle — Watchborne Design System

Self-contained HTML preview cards generated from this repo's design layer,
ready to push to a [claude.ai/design](https://claude.ai/design) design-system
project via the `/design-sync` skill / `DesignSync` tool.

## What's here

| Path | Contents |
| --- | --- |
| `build.mjs` | Generator. Reads the real tokens from `app/design-system/tokens.css`, emits one HTML card per component, then compiles a real Tailwind stylesheet and inlines it into every card (no CDN at render time). |
| `tailwind.preview.config.js` | Standalone Tailwind config mirroring `tailwind.config.js`'s color/token map (minus the animate plugin) so it builds without the project's `node_modules`. |
| `dist/` | The generated bundle: `foundations/` (3 cards) + `components/` (18 cards) + `manifest.json`. **This is what gets pushed.** |

Each card opens with a `<!-- @dsCard group="..." -->` marker, so the Design
System pane indexes it automatically — no manual `register_assets` step.

## Regenerate

```bash
node claude-design-bundle/build.mjs
```

Requires network access to the npm registry (for the standalone
`tailwindcss@3.4.0` CLI). Fonts (Space Grotesk / Inter / IBM Plex Mono) load
from Google Fonts at render time and degrade to system fonts if blocked.

## Push to Claude Design

The `DesignSync` tool needs a design-system authorization that **cannot be
granted from a Claude Code Web (remote) session** — `/design-login` requires an
interactive terminal. Complete the push one of two ways:

1. **From Claude Design** — open your design-system project and use
   **"Send to Claude Code Web"**, which seeds the project into the workspace;
   then ask Claude to run `/design-sync` against `claude-design-bundle/dist`.
2. **From the local CLI** — run `claude` in a terminal, `/design-login`, then
   `/design-sync` pointed at `claude-design-bundle/dist`.

The sync itself: `list_projects` → pick/create a `PROJECT_TYPE_DESIGN_SYSTEM`
project → `finalize_plan` (writes = `foundations/**`, `components/**`) →
`write_files` (using each card's `localPath`). Always incremental, one
component at a time — never a wholesale replace.
