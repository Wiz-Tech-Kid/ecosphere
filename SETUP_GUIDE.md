# Ecosphere v2.1 — Local Setup Guide

This guide covers every step from exporting the project from Replit through to running a clean, production-ready local development environment with all Replit artefacts removed.

---

## Prerequisites

Install these on your local machine before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS or 22 LTS | https://nodejs.org or `nvm` |
| pnpm | 9 or 10 | `npm install -g pnpm` |
| Git | any recent | https://git-scm.com |

Verify:
```bash
node --version    # v20.x or v22.x
pnpm --version    # 9.x or 10.x
git --version
```

---

## Step 1 — Export from Replit

Inside Replit, open the project menu (top-left three-dot menu or the project name dropdown) and select **Download as zip**. This gives you the full monorepo as a `.zip` file.

Extract it to wherever you keep your projects:
```bash
unzip ecosphere-v2.1.zip -d ~/projects/ecosphere
cd ~/projects/ecosphere
```

---

## Step 2 — Install Dependencies

The workspace uses pnpm workspaces. One install at the root installs all packages across all artifacts and libs:

```bash
pnpm install
```

This will:
- Install all dependencies for `artifacts/powamov` (the React frontend)
- Install all dependencies for `artifacts/api-server` (the Express backend)
- Install all lib packages (`lib/api-zod`, `lib/api-client-react`, `lib/db`, etc.)
- Respect the `minimumReleaseAge: 1440` setting in `pnpm-workspace.yaml` (packages must be 24h old before installation — this is a supply-chain security feature)

If you get errors about package ages being too recent, wait 24 hours and retry, or add the specific package to the `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml` as a temporary measure.

---

## Step 3 — Clean Up Replit Remnants

This section removes every trace of Replit-specific files and code from the project. Follow all sub-steps — skipping any will leave dead references or broken build logic.

### 3.1 — Delete Replit Config and Agent Files

These files are exclusively used by Replit's infrastructure and are safe to remove entirely:

```bash
rm .replit                    # Replit workspace configuration
rm .replitignore              # Replit's gitignore-like exclusion file
rm -rf .agents/               # Replit agent workspace directory (task queue etc.)
rm -rf .local/                # Replit agent skills, session plans, task files
rm -rf attached_assets/       # Replit's file upload/attachment system
rm scripts/post-merge.sh      # Replit-specific CI hook (runs after task agent merges)
```

**Why safe**: None of these files are imported by application code. `.replit` configures Replit workflows. `.agents/` and `.local/` are agent runtime directories. `attached_assets/` holds files uploaded through the Replit UI — if you uploaded any images through Replit's interface that are used in the app, copy them to `artifacts/powamov/public/` first and update the import paths before deleting.

**Check for attached_assets usage**:
```bash
grep -r "attached_assets" artifacts/powamov/src/
```
If you get matches, update those import paths before deleting the directory.

### 3.2 — Remove Replit Vite Plugins from Package Dependencies

Open `artifacts/powamov/package.json` and remove these three entries from `devDependencies`:

```json
"@replit/vite-plugin-cartographer": "catalog:",
"@replit/vite-plugin-dev-banner": "catalog:",
"@replit/vite-plugin-runtime-error-modal": "catalog:",
```

Also open `pnpm-workspace.yaml`. In the `catalog:` section, remove these four lines:

```yaml
'@replit/vite-plugin-cartographer': ^0.5.1
'@replit/vite-plugin-dev-banner': ^0.1.1
'@replit/vite-plugin-runtime-error-modal': ^0.0.6
```

And in the `minimumReleaseAgeExclude:` section, remove:

```yaml
  - '@replit/*'
  - stripe-replit-sync
```

The `stripe-replit-sync` entry is Replit billing infrastructure — remove it. The `@replit/*` exclusion is no longer needed once the Replit packages are gone.

### 3.3 — Rewrite vite.config.ts

The Vite config currently **throws an error** if `PORT` or `BASE_PATH` environment variables are not set — these are injected by Replit's artifact runner. In a local environment, you want sensible defaults instead.

Replace the entire contents of `artifacts/powamov/vite.config.ts` with:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
```

Key changes from the Replit version:
- `PORT` now defaults to `3000` instead of throwing
- `BASE_PATH` now defaults to `"/"` instead of throwing
- All three `@replit/vite-plugin-*` imports and usages removed
- The `@assets` alias removed (pointed to `attached_assets/` which we deleted)

### 3.4 — Clean Up .gitignore

Open `.gitignore` and remove the Replit-specific entries at the bottom:

```
# Remove these lines:
.cache/
.local/
```

You may want to keep `.cache/` in `.gitignore` if you have local build caches, but `.local/` is now gone so the entry is irrelevant either way.

### 3.5 — Update pnpm-workspace.yaml Packages List

Open `pnpm-workspace.yaml`. The `packages:` section lists:
```yaml
packages:
  - artifacts/*
  - lib/*
  - lib/integrations/*
  - scripts
```

If you are not using the `mockup-sandbox` artifact, you can ignore it — it will simply not be started unless you explicitly run its dev command.

### 3.6 — Remove Replit Packages from node_modules

After making the above changes, do a clean reinstall:

```bash
pnpm install
```

pnpm will automatically uninstall the removed packages and update the lockfile.

### 3.7 — Verify the Cleanup

Run a grep to confirm no Replit references remain in application code:

```bash
grep -r "@replit" artifacts/powamov/src/
grep -r "@replit" artifacts/api-server/src/
grep -r "REPL_ID" artifacts/
```

All three commands should return no matches.

---

## Step 4 — Environment Variables

### 4.1 — Frontend (artifacts/powamov)

Create a `.env` file at `artifacts/powamov/.env`:

```env
PORT=3000
BASE_PATH=/
```

Or simply omit it — the updated `vite.config.ts` now has defaults for both.

For a production build at a sub-path (e.g., you're hosting at `https://yourdomain.com/ecosphere`):
```env
BASE_PATH=/ecosphere/
```

### 4.2 — API Server (artifacts/api-server)

Create `artifacts/api-server/.env`:

```env
PORT=8080
```

Optionally, if you have a PostgreSQL database and want to replace the mock data with real persistence:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecosphere
```

If `DATABASE_URL` is not set, the server operates in mock mode using its in-memory `mockPowamov.ts` data — which is perfectly fine for development and demo purposes.

---

## Step 5 — Update dev Scripts (Optional but Recommended)

The current `package.json` `scripts` section at the workspace root doesn't have a dev shortcut. Add one for convenience:

Open the root `package.json` and update `scripts`:

```json
{
  "scripts": {
    "preinstall": "sh -c 'rm -f package-lock.json yarn.lock; case \"$npm_config_user_agent\" in pnpm/*) exit 0 ;; esac; case \"$(basename \"${npm_execpath:-}\")\" in pnpm|pnpm.cjs|pnpm.mjs) exit 0 ;; esac; echo \"Use pnpm instead\" >&2; exit 1'",
    "dev:frontend": "pnpm --filter @workspace/powamov run dev",
    "dev:api": "pnpm --filter @workspace/api-server run dev",
    "build": "pnpm run typecheck && pnpm -r --if-present run build",
    "typecheck": "pnpm -r --filter \"./artifacts/**\" --if-present run typecheck"
  }
}
```

---

## Step 6 — Run the Application

### 6.1 — Start the API Server

In a terminal:
```bash
pnpm --filter @workspace/api-server run dev
```

This builds the Express server using esbuild and starts it. You should see:
```
[INFO] Server listening  port: 8080
```

### 6.2 — Start the Frontend Dev Server

In a second terminal:
```bash
pnpm --filter @workspace/powamov run dev
```

You should see:
```
  VITE v7.x.x  ready in 1200ms
  ➜  Local:   http://localhost:3000/
```

Open `http://localhost:3000` in your browser. The sign-in page will appear.

### 6.3 — Running Both Simultaneously (Optional)

If you want to run both with a single command, install `concurrently`:
```bash
pnpm add -Dw concurrently
```

Then add to root `package.json` scripts:
```json
"dev": "concurrently \"pnpm dev:api\" \"pnpm dev:frontend\""
```

Now:
```bash
pnpm dev
```

---

## Step 7 — First Login

The app uses offline localStorage auth. There is no pre-created account. On first run:

1. Navigate to `http://localhost:3000`
2. Enter any email address and password
3. Click **Sign In** — if the email doesn't exist, it auto-creates the account
4. You are now logged in; the session persists for 30 days in `localStorage`

To start fresh (delete all local data):
```javascript
// Run in browser DevTools console:
localStorage.clear();
location.reload();
```

---

## Step 8 — Production Build

### 8.1 — Build the Frontend

```bash
pnpm --filter @workspace/powamov run build
```

Output goes to `artifacts/powamov/dist/public/`. This is a standard SPA — serve `index.html` for all routes.

### 8.2 — Build the API Server

```bash
pnpm --filter @workspace/api-server run build
```

Output goes to `artifacts/api-server/dist/index.mjs`.

### 8.3 — Serve the Production Build Locally (Verification)

Frontend preview:
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/powamov run serve
```

API server:
```bash
PORT=8080 node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Combined local app with frontend + API on one port:
```bash
pnpm run start
```

This builds both artifacts, starts the API on `http://localhost:3000`, and serves the frontend from the same process so `/api/*` works locally without a separate preview server.

### 8.4 — Deploy as a Static Site

If you only need the frontend (no API features — the core app works without the API server):

1. Run `pnpm --filter @workspace/powamov run build`
2. Copy `artifacts/powamov/dist/public/` to any static hosting provider:
   - **Netlify**: drag-and-drop the `dist/public` folder, or use `netlify deploy`
   - **Vercel**: `vercel --cwd artifacts/powamov/dist/public`
   - **GitHub Pages**: push `dist/public` contents to `gh-pages` branch
   - **Nginx/Apache**: serve `dist/public` with a catch-all rule returning `index.html`

For a Netlify repo-based deploy from the workspace root, the included `netlify.toml` uses `pnpm run build:netlify`, publishes `artifacts/powamov/dist/public`, rewrites `/api/*` to a Netlify Function, and keeps SPA history routing on `index.html`.

For a Vercel repo-based deploy from the workspace root, the included `vercel.json` uses `pnpm run build:vercel`, publishes `artifacts/powamov/dist/public`, keeps SPA routes working via `index.html` fallback, and exposes the mock Express endpoints on `/api/*` through a Vercel function.

For Nginx, a minimal config:
```nginx
server {
    listen 80;
    root /var/www/ecosphere;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Step 9 — Recommended .gitignore Additions for Local Dev

Add to `.gitignore`:

```gitignore
# Local environment files
*.env
.env.local
.env.*.local

# Build outputs
artifacts/*/dist/

# macOS
.DS_Store

# Editor
.idea/
*.swp
```

---

## Troubleshooting

### Error: `PORT environment variable is required`

You are running the old `vite.config.ts` that has the Replit guard. Make sure you completed Step 3.3 (rewriting the Vite config with defaults).

### Error: `Cannot find module '@replit/vite-plugin-runtime-error-modal'`

You deleted the packages from `package.json` but haven't re-run `pnpm install`, or the `vite.config.ts` still imports the plugins. Complete Step 3.3 and run `pnpm install`.

### Error: `Module not found: @assets`

You are importing from the `@assets` alias which pointed to `attached_assets/` (now deleted). Find the import with:
```bash
grep -r "@assets" artifacts/powamov/src/
```
Update each import to use `@/` (pointing to `src/`) or move the asset file to `artifacts/powamov/public/` and reference it as `/filename.ext`.

### White screen after login

Open browser DevTools → Console. If you see `BASE_URL` related errors, make sure `BASE_PATH` is set correctly. For hosting at root, `BASE_PATH=/` is correct. If hosting at a sub-path, make sure both the Vite config and the hosting server agree on the path.

### API server shows `SYSTEM OFFLINE` in sidebar

The sidebar health indicator calls `/api/healthz`. If your API server is not running, this is expected and does not affect any core app functionality — all emissions, telemetry, and calculator features work without the API server. Start `pnpm --filter @workspace/api-server run dev` if you need the POWAMOV node data, telemetry history, and maintenance forecast APIs.

### pnpm install fails with `minimumReleaseAge` error

A recently published package version is being blocked by the 24-hour supply-chain protection rule. You can:
1. Wait 24 hours and reinstall
2. Add the package name to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` temporarily
3. Use `--ignore-scripts` flag as a last resort: `pnpm install --ignore-scripts`

### TypeScript errors on `@workspace/api-client-react` imports in some pages

Some pages (`analytics.tsx`, `command.tsx`, `dashboard.tsx`, `maintenance.tsx`) import hook names that don't match what was generated by Orval from the current OpenAPI spec. These are pre-existing mismatches in the codebase that don't affect the runtime (the pages fall back to mock data). They can be fixed by running the Orval codegen:
```bash
pnpm --filter @workspace/api-spec run codegen
```
Or by updating the import names in each page to match the hooks actually exported by `@workspace/api-client-react`.

---

## File Tree After Cleanup

This is the expected state of the project root after all Replit files are removed:

```
ecosphere/
├── artifacts/
│   ├── powamov/            ← React app (cleaned vite.config.ts)
│   └── api-server/         ← Express API
├── lib/
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   └── db/
├── scripts/                ← Empty or removed if post-merge.sh was the only file
├── node_modules/           ← Generated by pnpm install (gitignored)
├── .git/                   ← Git history
├── .gitignore              ← Cleaned
├── .npmrc
├── package.json            ← Cleaned (no Replit scripts)
├── pnpm-lock.yaml          ← Updated after pnpm install
├── pnpm-workspace.yaml     ← Cleaned (no @replit catalog entries)
├── tsconfig.json
├── tsconfig.base.json
├── TECHNICAL_DOCS.md       ← This documentation
└── SETUP_GUIDE.md          ← This file
```

**Removed**:
- `.replit`
- `.replitignore`
- `.agents/`
- `.local/`
- `attached_assets/`
- `scripts/post-merge.sh`
