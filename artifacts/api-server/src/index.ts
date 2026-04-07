import app from "./app";
import net from "node:net";
import getPort, { portNumbers } from "get-port";
import { logger } from "./lib/logger";

function parsePreferredPort(rawPort: string | undefined): number | null {
  if (!rawPort) return null;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    logger.warn({ rawPort }, "Ignoring invalid PORT value");
    return null;
  }

  return port;
}

const preferredPort = parsePreferredPort(process.env["PORT"]);
const fallbackPorts = Array.from(portNumbers(3001, 3010));
const candidatePorts = preferredPort
  ? [preferredPort, ...fallbackPorts.filter((port) => port !== preferredPort)]
  : fallbackPorts;

const port = await resolvePort(candidatePorts);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info(
    { port, preferredPort: preferredPort ?? undefined },
    "Server listening",
  );
});

async function resolvePort(candidatePorts: number[]): Promise<number> {
  try {
    return await getPort({
      host: "127.0.0.1",
      port: candidatePorts,
    });
  } catch (error) {
    if (!isNetworkInterfaceError(error)) {
      throw error;
    }

    logger.warn(
      { error: String(error) },
      "get-port failed to inspect local interfaces, falling back to manual port scan",
    );

    return findAvailablePort(candidatePorts);
  }
}

function isNetworkInterfaceError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_SYSTEM_ERROR"
  );
}

async function findAvailablePort(candidatePorts: number[]): Promise<number> {
  for (const port of candidatePorts) {
    if (await canListenOnPort(port)) {
      return port;
    }
  }

  throw new Error("No available ports found in the 3001-3010 range.");
}

function canListenOnPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once("error", () => {
      resolve(false);
    });

    server.listen({ host: "127.0.0.1", port }, () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}
