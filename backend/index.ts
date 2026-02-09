import { Elysia, t } from "elysia";
import {cors} from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { routes } from "./server/routes";
import { connectToDatabase } from "./repository/db";
import { logger } from "./server/logger";

const server = new Elysia()
  .use(logger)
  .use(cors())
  .use(openapi())
  .get("/", "ping")
  .use(routes);

export type App = typeof server;

async function startServer() {
  await connectToDatabase();

  server.listen(3000);

  console.log("Server started port 3000");
}

startServer();
