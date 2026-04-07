import net from "node:net";
import concurrently from "concurrently";

async function findAvailablePort(ports: number[]): Promise<number> {
  for (const port of ports) {
    if (await canListenOnPort(port)) {
      return port;
    }
  }

  throw new Error("No available backend ports found in the 3001-3010 range.");
}

function canListenOnPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(250);

    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", (error: NodeJS.ErrnoException) => {
      socket.destroy();
      resolve(error.code !== "ECONNRESET");
    });
  });
}

const backendPort = await findAvailablePort(
  Array.from({ length: 10 }, (_, index) => 3001 + index),
);
const apiProxyTarget = `http://localhost:${backendPort}`;

console.log(`Using backend port ${backendPort}`);

const sharedEnv = { ...process.env };

const { result } = concurrently(
  [
    {
      command: "pnpm --filter @workspace/powamov run dev",
      name: "FRONTEND",
      prefixColor: "cyan",
      env: {
        ...sharedEnv,
        API_PROXY_TARGET: apiProxyTarget,
      },
    },
    {
      command: "pnpm --filter @workspace/api-server run dev",
      name: "BACKEND",
      prefixColor: "green",
      env: {
        ...sharedEnv,
        PORT: String(backendPort),
      },
    },
  ],
  {
    prefix: "[{name}]",
    killOthersOn: ["failure"],
  },
);

try {
  await result;
} catch {
  process.exitCode = 1;
}
