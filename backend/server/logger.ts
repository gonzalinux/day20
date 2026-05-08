import Elysia from "elysia";
import { log } from "./file-logger";
import { requestContext } from "./request-context";

const erroredRequests = new WeakSet<Request>();
const requestStart = new WeakMap<Request, number>();

export const logger = new Elysia({ name: "logger" })
  .onRequest(({ request }) => {
    requestStart.set(request, performance.now());
    const reqId = request.headers.get("x-request-id") ?? undefined;
    requestContext.enterWith({ reqId });
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
    const ms = Math.round(performance.now() - (requestStart.get(request) ?? performance.now()));
    log.info({ method, path, status, ms }, `Responded ${method} ${path} ${status} ${ms}ms`);
  })
  .onError(({ request, error }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    const message = (error as Error)?.message ?? "Unknown error";
    const ms = Math.round(performance.now() - (requestStart.get(request) ?? performance.now()));
    erroredRequests.add(request);
    log.error({ method, path, ms }, `Responded ${method} ${path} ${message} ${ms}ms`);
  })
  .as("global");
