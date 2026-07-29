import fs from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const appRoot = import.meta.dirname;
const workspaceRoot = path.resolve(appRoot, "../..");

function readLooseEnvFile(filePath: string): Record<string, string> {
  let fileContents: string;

  try {
    fileContents = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }

  return fileContents.split(/\r?\n/).reduce<Record<string, string>>((env, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      return env;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      return env;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const quote = rawValue[0];
    const value =
      (quote === "\"" || quote === "'") && rawValue.endsWith(quote)
        ? rawValue.slice(1, -1)
        : rawValue;

    env[key] = value;
    return env;
  }, {});
}

function firstPresentEnvValue(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value?.trim()))?.trim();
}

function parsePositivePort(rawValue: string | undefined, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

export default defineConfig(({ mode }) => {
  const appEnv = loadEnv(mode, appRoot, "");
  const workspaceEnv = loadEnv(mode, workspaceRoot, "");
  const looseWorkspaceEnv = readLooseEnvFile(path.resolve(workspaceRoot, ".env"));
  const env = { ...workspaceEnv, ...appEnv, ...process.env };
  const mapboxToken = firstPresentEnvValue(
    env.VITE_MAPBOX_TOKEN,
    env.MAPBOX_TOKEN,
    env.MAPBOX_ACCESS_TOKEN,
    env.MAPBOX_API_KEY,
    looseWorkspaceEnv.VITE_MAPBOX_TOKEN,
    looseWorkspaceEnv.MAPBOX_TOKEN,
    looseWorkspaceEnv.MAPBOX_ACCESS_TOKEN,
    looseWorkspaceEnv.MAPBOX_API_KEY,
    looseWorkspaceEnv["mapbox Token"],
    looseWorkspaceEnv["mapbox token"],
  );
  const mapboxStyleUrl = firstPresentEnvValue(
    env.VITE_MAPBOX_STYLE_URL,
    looseWorkspaceEnv.VITE_MAPBOX_STYLE_URL,
  );
  const port = parsePositivePort(env.PORT, 3000);
  const basePath = env.BASE_PATH?.trim() || "/";
  const buildOutDir = env.BUILD_OUT_DIR?.trim() || "dist/public";
  const apiProxyTarget = env.API_PROXY_TARGET?.trim() || "http://localhost:3001";

  return {
    base: basePath,
    envDir: workspaceRoot,
    plugins: [react(), tailwindcss()],
    define: {
      __POWAMOV_MAPBOX_TOKEN__: JSON.stringify(mapboxToken ?? ""),
      __POWAMOV_MAPBOX_STYLE_URL__: JSON.stringify(mapboxStyleUrl ?? ""),
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(mapboxToken ?? ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(appRoot, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(appRoot),
    build: {
      outDir: path.resolve(appRoot, buildOutDir),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      watch: {
        usePolling: true,
        interval: 500,
      },
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
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
  };
});
