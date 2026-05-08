import Elysia from "elysia";
import { fileLogger } from "./file-logger";

const erroredRequests = new WeakSet<Request>();

export const logger = new Elysia({ name: "logger" })
  .onRequest(({ request }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    console.log(`${method} ${path}`);
  })
  .onAfterResponse(({ request, set, responseValue }) => {
    if (erroredRequests.has(request)) {
      erroredRequests.delete(request);
      return;
    }
    const { method, url } = request;
    const path = new URL(url).pathname;
    const status = set.status as number;
    console.log(`${method} ${path} ${status} ${JSON.stringify(responseValue)}`);
    fileLogger?.info({ method, path, status }, `${method} ${path} ${status}`);
  })
  .onError(({ request, error }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    const message = (error as Error)?.message ?? "Unknown error";
    console.error(`${method} ${path} ${message}`);
    erroredRequests.add(request);
    fileLogger?.error({ method, path }, message);
  })
  .as("global");
