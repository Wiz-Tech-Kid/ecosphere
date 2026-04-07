import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const staticWebDir = resolveStaticWebDir(
  process.env["SERVE_WEB"],
  process.env["WEB_DIST_DIR"],
);

if (staticWebDir) {
  app.use(express.static(staticWebDir));

  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res, next) => {
    res.sendFile(path.join(staticWebDir, "index.html"), (error) => {
      if (error) {
        next(error);
      }
    });
  });

  logger.info({ staticWebDir }, "Serving built frontend assets");
}

export default app;

function resolveStaticWebDir(
  serveWebFlag: string | undefined,
  webDistDir: string | undefined,
): string | null {
  if (serveWebFlag !== "1" && serveWebFlag?.toLowerCase() !== "true") {
    return null;
  }

  const workspaceRoot = path.resolve(import.meta.dirname, "..", "..", "..");
  const candidateDir = path.resolve(
    workspaceRoot,
    webDistDir?.trim() || "artifacts/powamov/dist/public",
  );
  const indexFile = path.join(candidateDir, "index.html");

  if (!existsSync(indexFile)) {
    logger.warn(
      { candidateDir },
      "Frontend build output not found; static asset serving is disabled",
    );
    return null;
  }

  return candidateDir;
}
