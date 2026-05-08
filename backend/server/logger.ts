import Elysia from "elysia";
import { log } from "./file-logger";
import { requestContext } from "./request-context";

const erroredRequests = new WeakSet<Request>();
const requestStart = new WeakMap<Request, number>();
const requestId = new WeakMap<Request, string | undefined>();

export const logger = new Elysia({ name: "logger" })
  .onRequest(({ request }) => {
    requestStart.set(request, performance.now());
    const reqId = request.headers.get("x-request-id") ?? undefined;
    requestId.set(request, reqId);
    requestContext.enterWith({ reqId });
    const { method, url } = request;
    const path = new URL(url).pathname;
    console.log(`Received ${method} ${path}${reqId ? ` [${reqId}]` : ""}`);
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
    const reqId = requestId.get(request);
    log.info({ method, path, status, ms, reqId }, `Responded ${method} ${path} ${status} ${ms}ms${reqId ? ` [${reqId}]` : ""}`);
  })
  .onError(({ request, error }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    const message = (error as Error)?.message ?? "Unknown error";
    const ms = Math.round(performance.now() - (requestStart.get(request) ?? performance.now()));
    const reqId = requestId.get(request);
    erroredRequests.add(request);
    log.error({ method, path, ms, reqId }, `Responded ${method} ${path} ${message} ${ms}ms${reqId ? ` [${reqId}]` : ""}`);
  })
  .as("global");
