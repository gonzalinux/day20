import { Elysia } from "elysia";
import {cors} from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { routes } from "./server/routes";
import { connectToDatabase, disconnectFromDatabase } from "./repository/db";
import { logger } from "./server/logger";
import { startCleanupScheduler } from "./domain/service";

const server = new Elysia()
  .use(logger)
  .use(cors({
    origin: ["http://localhost:3500", "https://day-20.com"],
    credentials: true,
  }))
  .use(openapi())
  .group("/v1/api", (app) => app
    .get("/", "ping")
    .use(routes)
  );

export type App = typeof server;

async function startServer() {
  await connectToDatabase();

  server.listen(3000);
  startCleanupScheduler();

  console.log("Server started port 3000");
}

async function shutdown() {
  console.log("Shutting down...");
  await disconnectFromDatabase();
  server.stop();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
