import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { openapi } from "@elysiajs/openapi";
import { routes } from "./server/routes";
import { connectToDatabase } from "./repository/db";
import { UnauthorizedError } from "./server/errors.types";

const server = new Elysia().use(openapi()).use(routes);

export type App = typeof server;

async function startServer() {
  await connectToDatabase();

  server.listen(3000);

  console.log("Server started");
}

startServer();
