import { Elysia } from "elysia";
import { routes } from "./server/routes";
import { openapi } from "@elysiajs/openapi";

import { connectToDatabase } from "./repository/db";

async function startServer() {
  await connectToDatabase();

  new Elysia().use(openapi()).use(routes).listen(3000);
  console.log("Server started");
}

startServer();
