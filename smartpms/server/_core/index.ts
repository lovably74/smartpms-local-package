import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import os from "os";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

/** LAN(비루프백) IPv4 주소로 접속할 수 있는 URL 목록 */
function getLanAccessUrls(port: number): string[] {
  const urls: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const infos of Object.values(interfaces)) {
    if (!infos) continue;
    for (const info of infos) {
      if (info.family !== "IPv4" || info.internal) continue;
      urls.push(`http://${info.address}:${port}/`);
    }
  }
  return urls;
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Nginx 등 리버스 프록시 뒤에서 X-Forwarded-* / Secure 쿠키 판별용
  if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // 산출물 첨부 파일 로컬 저장 fallback 경로
  app.use("/uploads", express.static(path.resolve(import.meta.dirname, "..", "uploads")));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const listenHost = process.env.HOST ?? "0.0.0.0";
  server.listen(port, listenHost, () => {
    console.log(`Server running on http://localhost:${port}/`);
    const lanUrls = getLanAccessUrls(port);
    if (lanUrls.length > 0) {
      console.log("LAN (same subnet):");
      for (const url of lanUrls) {
        console.log(`  ${url}`);
      }
    }
  });
}

startServer().catch(console.error);
