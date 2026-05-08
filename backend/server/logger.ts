import Elysia from "elysia";
import { log } from "./file-logger";

const erroredRequests = new WeakSet<Request>();

export const logger = new Elysia({ name: "logger" })
  .onRequest(({ request }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    console.log(`Received ${method} ${path}`);
  })
  .onAfterResponse(({ request, set }) => {
    if (erroredRequests.has(request)) {
      erroredRequests.delete(request);
      return;
    }
    const { method, url } = request;
    const path = new URL(url).pathname;
    const status = set.status as number;
    log.info({ method, path, status }, `Responded ${method} ${path} ${status}`);
  })
  .onError(({ request, error }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    const message = (error as Error)?.message ?? "Unknown error";
    erroredRequests.add(request);
    log.error({ method, path }, `Responded ${method} ${path} ${message}`);
  })
  .as("global");
